package com.smarttimetable.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetable.entity.QuizQuestion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiQuizGeneratorService {

    public record GenerationResult(
            List<QuizQuestion> questions,
            String providerUsed,
            String modelUsed,
            String difficultyApplied,
            boolean usedExternalAi,
            String warning
    ) {}

    private record QuestionTemplate(String stem, String[] options, int correctIndex, String concept, String explanation) {}

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${perplexity.api.key:}")
    private String perplexityApiKey;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${ai.quiz.default-provider:AUTO}")
    private String defaultProvider;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;
    private final Map<String, Deque<String>> recentStemsByBucket = new ConcurrentHashMap<>();

    public AiQuizGeneratorService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(12_000);
        factory.setReadTimeout(45_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public List<QuizQuestion> generateQuestions(String topic, String notes, String difficulty, String type, int count) {
        return generateQuestionsWithMeta(topic, notes, difficulty, type, count, "AUTO", "", "", Collections.emptyList()).questions();
    }

    public GenerationResult generateQuestionsWithMeta(
            String rawTopic,
            String notes,
            String rawDifficulty,
            String rawType,
            int rawCount,
            String rawProvider,
            String requestApiKey,
            String requestModel,
            List<String> excludeQuestions) {

        String topic = (rawTopic != null && !rawTopic.trim().isEmpty()) ? rawTopic.trim() : "Computer Science Fundamentals";
        String difficulty = normalizeDifficulty(rawDifficulty);
        String qType = (rawType != null && rawType.equalsIgnoreCase("DESCRIPTIVE")) ? "DESCRIPTIVE" : "MCQ";
        int count = Math.max(1, Math.min(20, rawCount));
        String provider = normalizeProvider(rawProvider);

        Set<String> excludedStems = buildExclusionSet(topic, difficulty, excludeQuestions);
        List<String> warnings = new ArrayList<>();

        List<String> attemptChain = resolveProviderChain(provider);
        for (String target : attemptChain) {
            if ("BUILT_IN".equals(target)) break;
            String key = resolveApiKey(target, provider, requestApiKey);
            if (key == null || key.isBlank()) continue;

            try {
                GenerationResult ext = callExternalProvider(target, key, requestModel, topic, notes, difficulty, qType, count, excludedStems);
                if (!ext.questions().isEmpty()) {
                    List<QuizQuestion> finalList = new ArrayList<>(ext.questions());
                    if (finalList.size() < count) {
                        List<QuizQuestion> topUp = generateAdaptiveTopicQuestions(
                                topic, notes, difficulty, qType, count - finalList.size(), excludedStems);
                        finalList.addAll(topUp);
                    }
                    recordRecentStems(topic, difficulty, finalList);
                    return new GenerationResult(
                            finalList,
                            ext.providerUsed(),
                            ext.modelUsed(),
                            difficulty,
                            true,
                            warnings.isEmpty() ? null : String.join(" | ", warnings)
                    );
                }
            } catch (Exception ex) {
                warnings.add(target + ": " + ex.getMessage());
            }
        }

        List<QuizQuestion> synthesized = generateAdaptiveTopicQuestions(topic, notes, difficulty, qType, count, excludedStems);
        recordRecentStems(topic, difficulty, synthesized);

        String warnMsg = warnings.isEmpty()
                ? (attemptChain.contains("BUILT_IN") && !"BUILT_IN".equals(provider)
                        ? "No external AI API key configured on server or form; used Built-In Difficulty-Stratified Academic Engine."
                        : null)
                : "External AI fallback (" + String.join("; ", warnings) + "); completed with Built-In Academic Engine.";

        return new GenerationResult(synthesized, "Academic Smart Engine", "Difficulty-Stratified v2 (" + difficulty + ")", difficulty, false, warnMsg);
    }

    private GenerationResult callExternalProvider(
            String provider,
            String apiKey,
            String customModel,
            String topic,
            String notes,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) throws Exception {

        String prompt = buildExpertPrompt(topic, notes, difficulty, qType, count, excludedStems);

        if ("OPENAI".equals(provider)) {
            List<String> models = buildModelList(customModel, "gpt-4o-mini", "gpt-4o");
            return callOpenAiCompatibleProvider("OpenAI ChatGPT", "https://api.openai.com/v1/chat/completions", apiKey, models, prompt, topic, difficulty, qType, count, excludedStems);
        }
        if ("PERPLEXITY".equals(provider)) {
            List<String> models = buildModelList(customModel, "sonar-pro", "sonar");
            return callOpenAiCompatibleProvider("Perplexity AI", "https://api.perplexity.ai/chat/completions", apiKey, models, prompt, topic, difficulty, qType, count, excludedStems);
        }
        if ("GROQ".equals(provider)) {
            List<String> models = buildModelList(customModel, "llama-3.3-70b-versatile", "llama-3.1-8b-instant");
            return callOpenAiCompatibleProvider("Groq AI", "https://api.groq.com/openai/v1/chat/completions", apiKey, models, prompt, topic, difficulty, qType, count, excludedStems);
        }
        if ("GEMINI".equals(provider)) {
            List<String> models = buildModelList(customModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro");
            return callGeminiModels(apiKey, models, prompt, topic, difficulty, qType, count, excludedStems);
        }
        throw new IllegalArgumentException("Unsupported provider: " + provider);
    }

    private GenerationResult callOpenAiCompatibleProvider(
            String displayName,
            String endpointUrl,
            String apiKey,
            List<String> models,
            String prompt,
            String topic,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) throws Exception {

        Exception lastErr = null;
        for (String model : models) {
            try {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("model", model);
                body.put("temperature", 0.85);
                body.put("messages", List.of(
                        Map.of("role", "system", "content", "You output ONLY valid JSON arrays of unique university assessment questions calibrated accurately to Bloom's difficulty levels."),
                        Map.of("role", "user", "content", prompt)
                ));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey.trim());

                ResponseEntity<String> res = restTemplate.postForEntity(
                        endpointUrl,
                        new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                        String.class);

                JsonNode root = objectMapper.readTree(res.getBody());
                String rawText = root.path("choices").path(0).path("message").path("content").asText("");
                List<QuizQuestion> parsed = parseQuestionsJson(rawText, topic, difficulty, qType, count, excludedStems);
                if (!parsed.isEmpty()) {
                    return new GenerationResult(parsed, displayName, model, difficulty, true, null);
                }
            } catch (Exception ex) {
                lastErr = ex;
            }
        }
        throw lastErr != null ? lastErr : new IllegalStateException(displayName + " returned no valid questions.");
    }

    private GenerationResult callGeminiModels(
            String apiKey,
            List<String> models,
            String prompt,
            String topic,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) throws Exception {

        Exception lastErr = null;
        for (String model : models) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey.trim();

                Map<String, Object> genConfig = new LinkedHashMap<>();
                genConfig.put("temperature", 0.85);
                genConfig.put("topP", 0.95);
                genConfig.put("maxOutputTokens", 8192);
                genConfig.put("responseMimeType", "application/json");

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
                body.put("generationConfig", genConfig);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                ResponseEntity<String> res = restTemplate.postForEntity(
                        url,
                        new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                        String.class);

                JsonNode root = objectMapper.readTree(res.getBody());
                String rawText = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("");
                List<QuizQuestion> parsed = parseQuestionsJson(rawText, topic, difficulty, qType, count, excludedStems);
                if (!parsed.isEmpty()) {
                    return new GenerationResult(parsed, "Google Gemini", model, difficulty, true, null);
                }
            } catch (Exception ex) {
                lastErr = ex;
            }
        }
        throw lastErr != null ? lastErr : new IllegalStateException("Gemini returned no valid questions.");
    }

    private List<QuizQuestion> parseQuestionsJson(
            String rawText,
            String topic,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) throws Exception {

        String cleaned = stripCodeFences(rawText);
        if (cleaned.isEmpty()) return Collections.emptyList();

        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode arr = root.isArray() ? root : root.path("questions");
        if (!arr.isArray()) {
            int start = cleaned.indexOf('[');
            int end = cleaned.lastIndexOf(']');
            if (start >= 0 && end > start) {
                arr = objectMapper.readTree(cleaned.substring(start, end + 1));
            }
        }
        if (!arr.isArray()) return Collections.emptyList();

        List<QuizQuestion> result = new ArrayList<>();
        Set<String> batchSeen = new HashSet<>(excludedStems);
        boolean isDesc = "DESCRIPTIVE".equalsIgnoreCase(qType);
        int defaultMarks = difficultyMarks(difficulty);

        for (JsonNode qNode : arr) {
            if (result.size() >= count) break;
            String questionText = qNode.path("questionText").asText("").trim();
            if (questionText.isEmpty()) {
                questionText = qNode.path("question").asText("").trim();
            }
            if (questionText.isEmpty()) continue;

            String stem = normalizeStem(questionText);
            if (!batchSeen.add(stem)) continue;

            QuizQuestion q = new QuizQuestion();
            q.setQuestionText(questionText);
            q.setType(isDesc ? "DESCRIPTIVE" : "MCQ");
            q.setTopicConcept(qNode.path("topicConcept").asText(topic).trim());
            q.setDifficulty(difficulty);
            q.setMarks(defaultMarks);
            q.setExplanation(qNode.path("explanation").asText("Tests " + difficulty.toLowerCase() + "-level mastery of " + q.getTopicConcept() + "."));

            if (isDesc) {
                q.setOptions("");
                q.setCorrectAnswer(qNode.path("correctAnswer").asText("Refer to core architectural and theoretical principles of " + topic + ".").trim());
            } else {
                List<String> opts = extractOptionsList(qNode.path("options"));
                if (opts.size() < 2) continue;
                while (opts.size() < 4) {
                    opts.add("None of the above (" + (opts.size() + 1) + ")");
                }
                if (opts.size() > 4) {
                    opts = new ArrayList<>(opts.subList(0, 4));
                }
                String correctRaw = sanitizeOption(qNode.path("correctAnswer").asText(""));
                String matchedCorrect = opts.stream()
                        .filter(o -> o.equalsIgnoreCase(correctRaw))
                        .findFirst()
                        .orElse(opts.get(0));
                q.setOptions(String.join(",", opts));
                q.setCorrectAnswer(matchedCorrect);
            }
            result.add(q);
        }
        return result;
    }

    private List<String> extractOptionsList(JsonNode optionsNode) {
        List<String> opts = new ArrayList<>();
        if (optionsNode == null || optionsNode.isMissingNode() || optionsNode.isNull()) return opts;
        if (optionsNode.isArray()) {
            for (JsonNode item : optionsNode) {
                String clean = sanitizeOption(item.asText(""));
                if (!clean.isEmpty() && !opts.contains(clean)) opts.add(clean);
            }
        } else {
            String raw = optionsNode.asText("");
            String[] parts = raw.contains("|") ? raw.split("\\|") : raw.split(",");
            for (String part : parts) {
                String clean = sanitizeOption(part);
                if (!clean.isEmpty() && !opts.contains(clean)) opts.add(clean);
            }
        }
        return opts;
    }

    private String sanitizeOption(String val) {
        if (val == null) return "";
        // Replace internal commas with semicolons so comma-delimited DB/UI option splitting stays exact 4-way
        return val.trim().replaceAll("^[A-Da-d][).:]\\s+", "").replace(",", ";");
    }

    private String buildExpertPrompt(
            String topic,
            String notes,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) {

        String bloomsGuidance;
        switch (difficulty.toLowerCase(Locale.ROOT)) {
            case "easy":
                bloomsGuidance = "EASY LEVEL (Bloom L1-L2 Remember & Understand, 5 marks each):\n"
                        + "- Write clear, direct definition, terminology, syntax, and fundamental concept questions.\n"
                        + "- Avoid multi-step edge cases or complex debugging traps.";
                break;
            case "hard":
                bloomsGuidance = "HARD LEVEL (Bloom L4-L6 Analyze, Evaluate & Design, 15 marks each):\n"
                        + "- EVERY question MUST test edge cases, performance/complexity trade-offs, failure modes, debugging scenarios, or subtle architectural constraints.\n"
                        + "- Do NOT ask simple 'What is X?' definitions. Include plausible expert-level distractors.";
                break;
            default:
                bloomsGuidance = "MEDIUM LEVEL (Bloom L3-L4 Apply & Differentiate, 10 marks each):\n"
                        + "- Focus on practical application, comparing two approaches, workflow/execution order, and realistic usage scenarios.";
        }

        String angleSeed = "Variation Seed #" + (System.nanoTime() % 100000L)
                + " — cover diverse subtopics (architecture, lifecycle, invariants, pitfalls, comparisons, real scenarios).";

        String excludeBlock = "";
        if (!excludedStems.isEmpty()) {
            List<String> sampleEx = excludedStems.stream().limit(25).toList();
            excludeBlock = "\nSTRICT UNIQUENESS REQUIREMENT — DO NOT repeat or paraphrase any of these already-used questions:\n- "
                    + String.join("\n- ", sampleEx) + "\n";
        }

        String notesSection = (notes != null && !notes.trim().isEmpty())
                ? "FACULTY LESSON NOTES / LEARNING OBJECTIVES (prioritize these):\n" + notes.trim()
                : "No extra notes supplied. Draw upon rigorous university-level curriculum knowledge for \"" + topic + "\".";

        return "You are an expert university examiner framing distinct, zero-repetition quiz questions for college students.\n\n"
                + "TOPIC: \"" + topic + "\"\n"
                + "QUESTION TYPE: " + qType + "\n"
                + "DIFFICULTY TARGET: " + difficulty + "\n"
                + "REQUESTED COUNT: Exactly " + count + " completely unique questions\n"
                + angleSeed + "\n\n"
                + bloomsGuidance + "\n\n"
                + notesSection + "\n"
                + excludeBlock + "\n"
                + "OUTPUT RULES:\n"
                + ("DESCRIPTIVE".equalsIgnoreCase(qType)
                        ? "1. Set \"options\": \"\" and provide a clear, grading-ready model answer in \"correctAnswer\".\n"
                        : "1. Provide \"options\" as a JSON array of EXACTLY 4 distinct choices (no internal commas inside an option).\n"
                        + "2. \"correctAnswer\" must match one option EXACTLY.\n"
                        + "3. Randomize the correct option position across questions (do not always put the answer first!).\n")
                + "4. Return ONLY a raw JSON array (no markdown fences, no commentary) with objects having keys:\n"
                + "   \"questionText\", \"type\", \"options\", \"correctAnswer\", \"explanation\", \"topicConcept\", \"difficulty\".";
    }

    /**
     * Difficulty-stratified, non-repeating Built-In Academic Question Engine.
     * Ensures Easy, Medium, and Hard produce genuinely different cognitive questions
     * and never repeat questions across counts or consecutive runs.
     */
    private List<QuizQuestion> generateAdaptiveTopicQuestions(
            String topic,
            String notes,
            String difficulty,
            String qType,
            int count,
            Set<String> excludedStems) {

        boolean isDesc = "DESCRIPTIVE".equalsIgnoreCase(qType);
        int marks = difficultyMarks(difficulty);
        List<QuestionTemplate> pool = new ArrayList<>();

        // 1. Extract grounded questions directly from faculty notes if provided
        if (notes != null && !notes.trim().isEmpty()) {
            pool.addAll(synthesizeQuestionsFromNotes(topic, notes, difficulty));
        }

        // 2. Domain-specific curated banks stratified by Easy / Medium / Hard
        pool.addAll(getDomainBankForTopic(topic, difficulty));

        // 3. Broad difficulty-stratified academic concept banks for any arbitrary topic
        pool.addAll(getGeneralDifficultyTemplates(topic, difficulty));

        // Shuffle templates while keeping deterministic variety across calls
        Collections.shuffle(pool, new Random(System.nanoTime()));

        List<QuizQuestion> result = new ArrayList<>();
        Set<String> batchSeen = new HashSet<>(excludedStems);

        for (QuestionTemplate tpl : pool) {
            if (result.size() >= count) break;
            if (!batchSeen.add(normalizeStem(tpl.stem()))) continue;
            result.add(materializeQuestion(tpl, isDesc, difficulty, marks));
        }

        // 4. If faculty asked for more than pool size after exclusions, synthesize unique numbered aspect questions
        int attempt = 1;
        String[] extraAspects = {
                "Boundary Conditions", "Memory Footprint", "Execution Latency", "Fault Isolation",
                "Scalability Limit", "Interface Contracts", "Concurrency Safety", "Invariant Preservation",
                "Cache Locality", "Error Recovery", "Modular Coupling", "Verification Strategy"
        };
        while (result.size() < count && attempt <= 36) {
            String aspect = extraAspects[(attempt - 1) % extraAspects.length] + (attempt > extraAspects.length ? " (Case " + attempt + ")" : "");
            QuestionTemplate dyn = synthesizeAspectTemplate(topic, difficulty, aspect);
            attempt++;
            if (!batchSeen.add(normalizeStem(dyn.stem()))) continue;
            result.add(materializeQuestion(dyn, isDesc, difficulty, marks));
        }

        return result;
    }

    private QuizQuestion materializeQuestion(QuestionTemplate tpl, boolean isDesc, String difficulty, int marks) {
        QuizQuestion q = new QuizQuestion();
        q.setQuestionText(tpl.stem());
        q.setType(isDesc ? "DESCRIPTIVE" : "MCQ");
        q.setDifficulty(difficulty);
        q.setMarks(marks);
        q.setTopicConcept(tpl.concept());
        q.setExplanation(tpl.explanation());

        if (isDesc) {
            q.setOptions("");
            q.setCorrectAnswer(tpl.options()[tpl.correctIndex()] + " — " + tpl.explanation());
        } else {
            List<String> indexed = new ArrayList<>(Arrays.asList(tpl.options()));
            String correctOpt = sanitizeOption(indexed.get(Math.max(0, Math.min(indexed.size() - 1, tpl.correctIndex()))));
            List<String> cleanOpts = indexed.stream().map(this::sanitizeOption).collect(java.util.stream.Collectors.toList());
            Collections.shuffle(cleanOpts, new Random(System.nanoTime()));
            q.setOptions(String.join(",", cleanOpts));
            q.setCorrectAnswer(correctOpt);
        }
        return q;
    }

    private List<QuestionTemplate> synthesizeQuestionsFromNotes(String topic, String notes, String difficulty) {
        List<QuestionTemplate> list = new ArrayList<>();
        String[] sentences = notes.split("(?<=[.!?;\\n])\\s+");
        List<String> cleanFacts = new ArrayList<>();
        for (String s : sentences) {
            String trimmed = s.replaceAll("\\s+", " ").trim();
            if (trimmed.length() >= 25 && trimmed.length() <= 220) {
                cleanFacts.add(trimmed);
            }
        }
        if (cleanFacts.isEmpty()) return list;

        for (int i = 0; i < Math.min(cleanFacts.size(), 8); i++) {
            String fact = cleanFacts.get(i).replace(",", ";");
            String shortFact = fact.length() > 110 ? fact.substring(0, 107) + "..." : fact;
            String stem;
            String[] opts;
            String concept = topic + " — Note Point " + (i + 1);

            if ("Easy".equalsIgnoreCase(difficulty)) {
                stem = "According to the lesson notes on " + topic + ", which statement accurately describes key point #" + (i + 1) + "?";
                opts = new String[]{
                        shortFact,
                        topic + " eliminates the need for input validation altogether",
                        topic + " always executes in constant O(1) hardware time regardless of input",
                        "It applies only to legacy assembly programs without OS support"
                };
            } else if ("Hard".equalsIgnoreCase(difficulty)) {
                stem = "In an advanced evaluation scenario for " + topic + ", what critical implication follows from the principle: \"" + shortFact + "\"?";
                opts = new String[]{
                        "Designs must uphold that constraint under edge-case loads or correctness/efficiency degrades",
                        "That constraint can be safely disabled in production without impacting invariants",
                        "It forces single-threaded polling across every subsystem layer",
                        "It guarantees zero resource contention even without synchronization"
                };
            } else {
                stem = "When applying the " + topic + " rule from your notes (\"" + shortFact + "\") in practice, which decision is MOST sound?";
                opts = new String[]{
                        "Align implementation choices with this rule before scaling the module",
                        "Bypass this rule whenever two components communicate asynchronously",
                        "Defer adhering to this rule until after deployment failure occurs",
                        "Replace structured modular checks with manual console logging"
                };
            }
            list.add(new QuestionTemplate(stem, opts, 0, concept, "Derived directly from faculty notes: " + shortFact));
        }
        return list;
    }

    private List<QuestionTemplate> getDomainBankForTopic(String topic, String difficulty) {
        String t = topic.toLowerCase(Locale.ROOT);
        List<QuestionTemplate> out = new ArrayList<>();

        if (t.contains("data structure") || t.contains("dsa") || t.contains("linked list") || t.contains("tree") || t.contains("stack") || t.contains("queue") || t.contains("algorithm") || t.contains("sort") || t.contains("graph")) {
            if ("Easy".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Which data structure strictly enforces LIFO (Last-In First-Out) insertion and removal?", new String[]{"Stack", "Queue", "Binary Search Tree", "Adjacency List"}, 0, "Linear Structures", "A stack pushes and pops from the top end in LIFO order."));
                out.add(new QuestionTemplate("What does each node in a singly linked list contain besides its data field?", new String[]{"A pointer/reference to the next node", "Two parent pointers", "A hash bucket index", "An adjacency matrix row"}, 0, "Linked Lists", "Each singly linked list node holds data plus one next reference."));
                out.add(new QuestionTemplate("In a Queue, where are new elements normally inserted (enqueue)?", new String[]{"At the rear/tail end", "Only at the middle index", "Always at index 0 by shifting", "At the root parent"}, 0, "Queues", "FIFO queues enqueue at the rear and dequeue from the front."));
                out.add(new QuestionTemplate("What is the worst-case time complexity of searching an unsorted array of n elements sequentially?", new String[]{"O(n)", "O(1)", "O(log n)", "O(n^2)"}, 0, "Time Complexity", "Linear scan checks up to all n elements when unsorted."));
                out.add(new QuestionTemplate("Which tree traversal visits the Left subtree; Root node; then Right subtree?", new String[]{"Inorder traversal", "Preorder traversal", "Postorder traversal", "Level-order BFS"}, 0, "Trees", "Inorder (Left-Root-Right) outputs sorted keys on a BST."));
            } else if ("Hard".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Why can Quicksort degrade to O(n^2) even though Merge Sort stays O(n log n); and how do production libraries prevent it?", new String[]{"Adversarial pivot splits; prevented via Introsort switching to Heapsort on deep recursion", "Excessive stack allocation; fixed by removing base cases", "Cache misses during merging; solved with bubble passes", "Unbounded recursion in binary search; solved by linear scan"}, 0, "Sorting & Introsort", "Poor pivots trigger O(n^2) recursion unless median-of-three or Introsort bounds depth."));
                out.add(new QuestionTemplate("In Floyd's cycle detection algorithm on a linked list; once fast and slow pointers meet inside a cycle; what locates the cycle entry node?", new String[]{"Resetting one pointer to head and advancing both 1 step at a time until they meet", "Advancing only the fast pointer by 3 steps", "Reversing the entire list in O(n) extra space", "Comparing node values via binary search"}, 0, "Pointer Algorithms", "Distance from head to cycle start equals meeting-point remainder distance to cycle start."));
                out.add(new QuestionTemplate("When balancing an AVL tree after insertion triggers a Left-Right (LR) imbalance at node Z; which rotation sequence restores height balance?", new String[]{"Left rotation on Z's left child followed by Right rotation on Z", "Single Left rotation directly on Z", "Two consecutive Right rotations on Z", "Deleting Z's right leaf node"}, 0, "Self-Balancing Trees", "LR imbalance requires a double rotation: left on child then right on unbalanced ancestor."));
                out.add(new QuestionTemplate("Which graph condition causes Dijkstra's standard greedy algorithm to produce incorrect shortest paths?", new String[]{"Presence of negative-weight edges reachable from the source", "Presence of multiple vertices with zero out-degree", "Disjoint connected components", "Dense undirected edges with positive weights"}, 0, "Shortest Paths", "Greedy settlement fails with negative edge weights where Bellman-Ford is needed."));
                out.add(new QuestionTemplate("In open-addressing hash tables; why does lazy deletion use a 'tombstone' marker instead of simply clearing the slot to NULL?", new String[]{"Clearing to NULL would prematurely break probe chains for keys inserted later", "NULL consumes twice as much heap memory", "Tombstones automatically rehash all keys in O(1)", "Clearing to NULL changes the hash function modulo"}, 0, "Hash Tables", "Probing stops on NULL; tombstones preserve probe continuity during lookups."));
            } else {
                out.add(new QuestionTemplate("Which operation is O(1) in a singly linked list with a head pointer but O(n) in a standard contiguous array?", new String[]{"Inserting a new element at the very beginning", "Random access by index i", "Binary searching sorted elements", "Computing total array length"}, 0, "Linked Lists vs Arrays", "Prepending to head only rewires one pointer whereas arrays shift all n items."));
                out.add(new QuestionTemplate("If you perform BFS on an unweighted graph starting at vertex S; what property does the first visit to any vertex V guarantee?", new String[]{"It uses the minimum number of edges from S to V", "It maximizes edge weight sum", "It finds a topological ordering in cyclic graphs", "It visits V after all deeper neighbors finish"}, 0, "Graph Traversal", "BFS explores level by level so first discovery equals shortest unweighted path."));
                out.add(new QuestionTemplate("How do you implement FIFO queue behavior using two LIFO stacks with amortized O(1) cost per operation?", new String[]{"Push to an inbox stack and transfer all items to an outbox stack only when outbox is empty", "Copy both stacks on every single push", "Sort the inbox stack after every pop", "Keep only the minimum item in the second stack"}, 0, "Stacks & Queues", "Each item moves from inbox to outbox at most once, giving O(1) amortized dequeue."));
                out.add(new QuestionTemplate("When checking balanced parentheses in an expression string; what indicates a mismatch immediately?", new String[]{"Closing bracket does not match the stack top or stack is empty on a closing bracket", "Encountering an operand inside parentheses", "Seeing two consecutive opening brackets", "String length being an even integer"}, 0, "Stack Applications", "A closing symbol must pair with the most recently opened unmatched symbol."));
                out.add(new QuestionTemplate("Which heap property holds for every node i in a binary Min-Heap?", new String[]{"The key of parent node i is less than or equal to the keys of its children", "Left child key is always strictly less than right child key", "All leaf nodes share identical values", "Inorder traversal produces sorted ascending output"}, 0, "Heaps", "Min-Heap only constrains parent-to-child order, not sibling order."));
            }
        } else if (t.contains("java") || t.contains("oop") || t.contains("spring")) {
            if ("Easy".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Which Java keyword enables a subclass to inherit fields and methods from a parent class?", new String[]{"extends", "implements", "import", "package"}, 0, "Inheritance", "Classes use 'extends' for class inheritance and 'implements' for interfaces."));
                out.add(new QuestionTemplate("What component executes compiled Java bytecode (.class files) across different operating systems?", new String[]{"Java Virtual Machine (JVM)", "SQL Query Optimizer", "BIOS Bootloader", "CSS Layout Engine"}, 0, "JVM Basics", "The JVM interprets and JIT-compiles bytecode per platform."));
                out.add(new QuestionTemplate("Which access modifier restricts member visibility strictly to the declaring class itself?", new String[]{"private", "public", "protected", "default"}, 0, "Encapsulation", "private fields cannot be accessed directly from outside classes."));
                out.add(new QuestionTemplate("What method signature serves as the standard entry point of a standalone Java application?", new String[]{"public static void main(String[] args)", "private void start()", "static int init()", "public main()"}, 0, "Java Syntax", "The JVM invokes public static void main(String[] args)."));
                out.add(new QuestionTemplate("Which OOP pillar hides internal object state behind controlled getter/setter methods?", new String[]{"Encapsulation", "Recursion", "Serialization", "Overloading"}, 0, "OOP Concepts", "Encapsulation bundles data and enforces invariants through controlled methods."));
            } else if ("Hard".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Why must overriding equals() in a Java entity always be paired with a consistent hashCode() override?", new String[]{"Hash-based collections rely on equal objects returning equal bucket hashes to avoid lost lookups", "The JVM refuses to compile any class missing hashCode()", "Garbage collection requires identical hashCode values before sweeping", "JDBC converts equals() calls into hashCode SQL joins"}, 0, "Object Contract", "If two equal objects produce different hashCodes, HashMap/HashSet lookups miss them."));
                out.add(new QuestionTemplate("In Spring Boot; why does calling a @Transactional method from another method inside the SAME bean bypass transaction management?", new String[]{"Self-invocation calls 'this' directly rather than going through the Spring AOP proxy", "H2 disables transactions on private beans", "Spring strips annotations after first HTTP call", "@Transactional only supports static methods"}, 0, "Spring AOP Proxies", "Declarative transactions intercept calls entering through the proxy boundary."));
                out.add(new QuestionTemplate("What problem does Java's 'volatile' keyword solve cleanly; and what concurrency issue does it NOT prevent on its own?", new String[]{"Guarantees cross-thread visibility and ordering; does NOT make compound check-then-act or i++ atomic", "Guarantees deadlock freedom across locks; fails on Strings", "Replaces synchronized blocks for multi-field invariants", "Disables thread scheduling on multicore CPUs"}, 0, "Java Memory Model", "volatile guarantees happens-before visibility, not atomicity for read-modify-write."));
                out.add(new QuestionTemplate("Why can double-checked locking for a lazy singleton break in Java if the singleton instance field is NOT declared volatile?", new String[]{"Instruction reordering may expose a partially constructed object reference to another thread", "The heap refuses null checks inside synchronized blocks", "Static constructors execute after main() returns", "JVM locks cannot guard reference assignments"}, 0, "Concurrency & JMM", "Without volatile, constructor writes can reorder after publishing the reference."));
                out.add(new QuestionTemplate("What triggers an OutOfMemoryError: Metaspace in long-running JVM applications?", new String[]{"Excessive dynamic class/proxy generation or classloader leaks preventing class metadata unloading", "Creating too many local primitive variables on one thread stack", "Returning empty Lists from REST controllers", "Exceeding maximum TCP socket backlog"}, 0, "JVM Internals", "Class metadata lives in Metaspace and leaks if dynamic ClassLoaders remain referenced."));
            } else {
                out.add(new QuestionTemplate("How does method overriding differ from method overloading in Java OOP?", new String[]{"Overriding redefines a superclass method with matching signature at runtime; overloading reuses a name with different parameters", "Overriding requires different parameter types while overloading forbids them", "Overloading happens at runtime and overriding only for static methods", "There is no behavioral difference between them"}, 0, "Polymorphism", "Overriding enables runtime dispatch; overloading resolves at compile time by parameter list."));
                out.add(new QuestionTemplate("Why is String immutable in Java when used for HashMap keys and security credentials?", new String[]{"Its hashcode stays invariant and shared references cannot be silently mutated", "Immutable objects never allocate heap space", "Strings cannot be garbage collected otherwise", "It forces every String onto the CPU L1 cache"}, 0, "Strings & Collections", "Immutability guarantees thread-safety and hash stability in HashMaps."));
                out.add(new QuestionTemplate("When should you choose LinkedList over ArrayList in Java?", new String[]{"Frequent O(1) insertions/removals at both ends via Deque without random index lookups", "Frequent binary search by index", "Minimizing per-element memory overhead", "Fast contiguous iteration over millions of primitives"}, 0, "Java Collections", "LinkedList avoids array shifting at ends, whereas ArrayList wins on random access and cache locality."));
                out.add(new QuestionTemplate("What happens if a checked exception inside a try block is NOT caught by matching catch handlers or declared with throws?", new String[]{"The Java compiler rejects the code at compile time", "The JVM converts it silently into null", "It runs normally until GC runs", "It triggers a StackOverflowError"}, 0, "Exception Handling", "Checked exceptions require explicit catch or throws declaration."));
                out.add(new QuestionTemplate("What role does the Spring IoC container (@Service / @Autowired) play in an application?", new String[]{"Instantiates; configures; and injects bean dependencies to decouple components", "Replaces SQL queries with HTML strings", "Compiles JavaScript files in the browser", "Encrypts all TCP packets automatically"}, 0, "Dependency Injection", "IoC manages bean lifecycles and dependency wiring."));
            }
        } else if (t.contains("dbms") || t.contains("sql") || t.contains("database")) {
            if ("Easy".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("What constraint uniquely identifies each row in a relational database table and disallows NULL?", new String[]{"PRIMARY KEY", "FOREIGN KEY", "GROUP BY", "ORDER BY"}, 0, "Relational Keys", "A Primary Key enforces entity uniqueness and NOT NULL."));
                out.add(new QuestionTemplate("Which SQL clause filters rows BEFORE grouping or aggregation occurs?", new String[]{"WHERE", "HAVING", "ORDER BY", "DISTINCT"}, 0, "SQL Filtering", "WHERE filters individual rows; HAVING filters grouped aggregates."));
                out.add(new QuestionTemplate("What does the 'A' in ACID database transaction properties stand for?", new String[]{"Atomicity", "Availability", "Asynchronous", "Authentication"}, 0, "Transactions", "Atomicity ensures a transaction completes all-or-nothing."));
                out.add(new QuestionTemplate("Which SQL command removes all rows from a table without dropping its schema definition?", new String[]{"TRUNCATE TABLE", "DROP TABLE", "ALTER TABLE", "CREATE VIEW"}, 0, "DDL/DML Commands", "DROP removes the table itself; TRUNCATE clears rows while keeping structure."));
                out.add(new QuestionTemplate("What SQL keyword removes duplicate values from a SELECT result set?", new String[]{"DISTINCT", "UNIQUE_ONLY", "FILTER", "COALESCE"}, 0, "SQL Queries", "SELECT DISTINCT deduplicates returned tuples."));
            } else if ("Hard".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Which concurrency anomaly can occur under READ COMMITTED isolation level when two queries inside one transaction read the same range?", new String[]{"Non-repeatable reads and phantom rows when another committed transaction modifies rows in between", "Dirty uncommitted writes leaking from aborted rollbacks", "Complete prevention of lock waits", "Automatic conversion of inner joins to cross joins"}, 0, "Isolation Levels", "READ COMMITTED prevents dirty reads but allows non-repeatable and phantom reads."));
                out.add(new QuestionTemplate("How does Boyce-Codd Normal Form (BCNF) tighten 3rd Normal Form (3NF)?", new String[]{"Every non-trivial functional dependency X -> Y must have X as a superkey without exception for prime attributes", "All tables must contain at least 3 foreign keys", "Composite primary keys are prohibited completely", "Multivalued dependencies are ignored"}, 0, "Normalization", "3NF allows Y to be prime; BCNF requires every determinant X to be a superkey."));
                out.add(new QuestionTemplate("Why can creating excessive B+Tree indexes on a write-heavy OLTP table degrade overall system throughput?", new String[]{"Every INSERT/UPDATE/DELETE must synchronously maintain all affected index pages and WAL logs", "B+Trees prevent WHERE clauses from using primary keys", "Indexes double network packet latency per SELECT", "H2/MySQL refuses transactions on indexed tables"}, 0, "Indexing Trade-offs", "Indexes speed reads at the cost of write amplification and buffer churn."));
                out.add(new QuestionTemplate("Under Two-Phase Locking (2PL); why does Strict 2PL hold exclusive write locks until transaction commit or abort?", new String[]{"To prevent cascading aborts caused by another transaction reading uncommitted dirty data", "To disable deadlocks permanently", "To avoid checking foreign keys", "To sort tuples in descending order"}, 0, "Concurrency Control", "Strict 2PL guarantees serializability without cascading rollbacks."));
                out.add(new QuestionTemplate("When querying a composite index on (department_id, semester, last_name); why does filtering ONLY by last_name typically skip the B+Tree index seek?", new String[]{"Leftmost prefix rule: keys are ordered by department_id first so non-leading columns cannot narrow the tree range", "Composite indexes only apply to JOINs", "SQL treats VARCHAR columns as unindexable", "Primary keys override composite indexes on WHERE"}, 0, "Query Optimization", "B+Tree lookup depends on a leading prefix unless an index skip scan applies."));
            } else {
                out.add(new QuestionTemplate("How does an INNER JOIN behave differently from a LEFT JOIN when a row in the left table has no match in the right table?", new String[]{"INNER JOIN omits the unmatched left row while LEFT JOIN keeps it with NULLs for right columns", "LEFT JOIN drops both tables' unmatched rows", "INNER JOIN fills unmatched right columns with zeros", "They return identical rows in all cases"}, 0, "SQL Joins", "LEFT JOIN preserves all left-table rows regardless of right match."));
                out.add(new QuestionTemplate("When normalizing a table into Second Normal Form (2NF); which dependency must be eliminated?", new String[]{"Partial dependencies where a non-key attribute depends on only part of a composite primary key", "Every single foreign key reference", "All attributes stored as integers", "Every one-to-one relation"}, 0, "Normalization (2NF)", "2NF eliminates partial dependencies on composite primary keys."));
                out.add(new QuestionTemplate("Why do parameterized PreparedStatements protect applications against SQL Injection attacks?", new String[]{"User inputs are bound strictly as literal data values rather than parsed as executable SQL tokens", "They compress SQL strings using Base64", "They convert SELECTs into stored views", "They disable database authentication"}, 0, "Database Security", "Bind parameters separate SQL grammar from user-supplied data."));
                out.add(new QuestionTemplate("What is the correct execution behavior when using GROUP BY alongside HAVING?", new String[]{"Rows are filtered by WHERE first; grouped by columns; then aggregate groups are filtered by HAVING", "HAVING runs before FROM and JOIN", "GROUP BY sorts descending before WHERE", "HAVING only filters NULL primary keys"}, 0, "SQL Aggregation", "HAVING evaluates conditions after groups and aggregates are formed."));
                out.add(new QuestionTemplate("What happens automatically if an ON DELETE CASCADE foreign key constraint is triggered when deleting a parent record?", new String[]{"Matching child rows referencing that parent are deleted automatically", "Child rows are migrated to an archive table", "The parent deletion silently succeeds without touching children", "SQL drops the entire child schema"}, 0, "Referential Integrity", "ON DELETE CASCADE propagates parent deletions to referencing children."));
            }
        } else if (t.contains("operating system") || t.contains("os") || t.contains("deadlock") || t.contains("scheduling") || t.contains("memory")) {
            if ("Easy".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("Which CPU scheduling algorithm executes processes strictly in arrival order without preemption?", new String[]{"First-Come First-Served (FCFS)", "Round Robin", "Multilevel Feedback Queue", "Shortest Remaining Time First"}, 0, "CPU Scheduling", "FCFS dispatches ready processes sequentially by arrival."));
                out.add(new QuestionTemplate("What OS component handles switching CPU state from one process/thread to another?", new String[]{"Dispatcher / Context Switcher", "Disk Formatter", "DNS Resolver", "HTML Parser"}, 0, "Process Management", "Context switching saves the current PCB state and loads the next process."));
                out.add(new QuestionTemplate("How many Coffman conditions must hold simultaneously for a deadlock to occur?", new String[]{"All 4 (Mutual Exclusion; Hold & Wait; No Preemption; Circular Wait)", "Only 1 condition", "Exactly 2 conditions", "None; deadlocks occur randomly"}, 0, "Deadlocks", "Breaking any single Coffman condition prevents deadlock."));
                out.add(new QuestionTemplate("What mechanism lets a process address more memory than physically installed RAM using disk backing?", new String[]{"Virtual Memory (Paging)", "Static Linking", "DMA Bypass", "Interrupt Polling"}, 0, "Memory Management", "Virtual memory maps pages dynamically between RAM frames and swap."));
                out.add(new QuestionTemplate("Which hardware event occurs when a program accesses a memory page not currently loaded in physical RAM?", new String[]{"Page Fault", "Stack Push", "Branch Hit", "Clock Tick"}, 0, "Paging", "A page fault traps into the OS to bring the page into a free frame."));
            } else if ("Hard".equalsIgnoreCase(difficulty)) {
                out.add(new QuestionTemplate("What causes 'Thrashing' in a demand-paged virtual memory system and how does a working-set model stop it?", new String[]{"Pages are swapped in and out faster than useful work; fixed by suspending processes whose working sets exceed available frames", "CPU clock frequency halves; fixed by disabling interrupts", "TLB cache hits reach 100%; fixed by adding swap partitions", "Kernel threads deadlock on boot; fixed by FCFS"}, 0, "Virtual Memory Thrashing", "Thrashing arises when aggregate working sets exceed physical frames."));
                out.add(new QuestionTemplate("Why is Priority Inversion dangerous in real-time kernels and how does Priority Inheritance solve it?", new String[]{"A low-priority lock holder delays a high-priority waiter via medium-priority preemption; temporarily boosting the lock holder lets it release the lock quickly", "Two threads allocate identical heap addresses; fixed with paging", "Round-Robin quantum becomes 0; fixed by FCFS", "Child processes become zombies; fixed by waitpid"}, 0, "Real-Time Synchronization", "Priority inheritance elevates a lock holder to unblock high-priority waiters."));
                out.add(new QuestionTemplate("In a 64-bit OS with multi-level page tables; why is a Translation Lookaside Buffer (TLB) critical for performance?", new String[]{"Walking 4-5 page table levels in RAM per instruction would multiply memory latency without fast TLB caching", "TLB permanently replaces physical RAM chips", "TLB encrypts user-space stacks", "Page tables cannot fit in 64-bit virtual space"}, 0, "MMU & TLB", "TLB caches recent virtual-to-physical translations in hardware."));
                out.add(new QuestionTemplate("Under Belady's Anomaly; which page replacement policy can unexpectedly suffer MORE page faults when given MORE physical frames?", new String[]{"FIFO (First-In First-Out)", "LRU (Least Recently Used)", "Optimal (Belady's MIN)", "LFU stack algorithms"}, 0, "Page Replacement", "FIFO is not a stack algorithm and can exhibit Belady's anomaly."));
                out.add(new QuestionTemplate("How does copy-on-write (CoW) make POSIX fork() nearly instantaneous for large parent processes?", new String[]{"Parent and child initially share read-only physical frames until either writes; cloning only the modified page", "fork() skips creating a PCB entry", "Child runs directly inside kernel ring 0 without address spaces", "OS compresses all heap RAM to zero bytes"}, 0, "Process Creation", "CoW avoids copying untouched pages on fork()."));
            } else {
                out.add(new QuestionTemplate("How does choosing a too-small time quantum in Round Robin CPU scheduling impact system performance?", new String[]{"Increases context-switch overhead and lowers effective CPU throughput", "Eliminates all context switches", "Guarantees minimum average waiting time", "Converts Round Robin into SJF"}, 0, "Scheduling Trade-offs", "Excessively short quanta waste CPU cycles in frequent PCB saves/restores."));
                out.add(new QuestionTemplate("What is the difference between Internal Fragmentation and External Fragmentation?", new String[]{"Internal wastes unused space inside an allocated fixed block; external leaves small uncontiguous free holes between blocks", "Internal occurs only on SSDs while external occurs in registers", "External only affects virtual paging", "They refer to identical problems"}, 0, "Memory Allocation", "Fixed paging creates internal fragmentation; contiguous partitioning causes external fragmentation."));
                out.add(new QuestionTemplate("How does a Semaphore differ from a Mutex in thread synchronization?", new String[]{"A counting semaphore manages multiple resource permits and can be signaled by another thread; a mutex enforces single-thread ownership", "A mutex allows unlimited concurrent holders", "Semaphores only work in single-threaded Java", "Mutexes run inside the browser DOM"}, 0, "Synchronization", "Mutex has strict lock ownership; counting semaphores signal permits."));
                out.add(new QuestionTemplate("In Banker's Algorithm; when is a resource allocation request granted?", new String[]{"Only when simulating the grant still leaves the system in a safe state where all processes can finish", "Whenever at least 1 unit is free regardless of max need", "Only to the oldest PID", "After terminating all waiting processes"}, 0, "Deadlock Avoidance", "Banker's checks safe-sequence existence before committing allocations."));
                out.add(new QuestionTemplate("What distinguishes a User-level thread switch from a Process switch in the same address space?", new String[]{"Threads share code/heap/open files so switching avoids flushing the full memory mapping", "Threads force an entire disk format", "Threads cannot share memory", "Process switches ignore registers"}, 0, "Threads vs Processes", "Shared address spaces make thread context switching much lighter."));
            }
        }
        return out;
    }

    private List<QuestionTemplate> getGeneralDifficultyTemplates(String topic, String difficulty) {
        List<QuestionTemplate> list = new ArrayList<>();
        if ("Easy".equalsIgnoreCase(difficulty)) {
            list.add(new QuestionTemplate("Which statement BEST defines the core objective of " + topic + "?", new String[]{
                    topic + " provides structured rules and principles to solve domain problems reliably",
                    topic + " exists solely for decorative UI color styling",
                    topic + " removes the need for any input data validation",
                    topic + " executes exclusively inside offline printer firmware"
            }, 0, "Core Definition", "Foundational knowledge begins with understanding why " + topic + " exists."));
            list.add(new QuestionTemplate("What is a primary benefit students gain when applying " + topic + " correctly?", new String[]{
                    "Predictable; maintainable; and accurate results",
                    "Random unverified outputs per run",
                    "Elimination of all system memory",
                    "Disabled error reporting in production"
            }, 0, "Fundamental Benefits", topic + " emphasizes correctness and maintainability."));
            list.add(new QuestionTemplate("When learning " + topic + " for the first time; which prerequisite should be verified first?", new String[]{
                    "Clear problem inputs; terminology; and expected outputs",
                    "Skipping specifications and hardcoding random constants",
                    "Disabling all debugging tools before compiling",
                    "Duplicating unreviewed modules across every package"
            }, 0, "Foundational Concepts", "Understanding inputs, terms, and outputs anchors beginner comprehension."));
            list.add(new QuestionTemplate("In standard terminology for " + topic + "; why is modular decomposition encouraged?", new String[]{
                    "It breaks complex logic into smaller; testable units",
                    "It increases coupling across unrelated components",
                    "It prevents code reuse by other developers",
                    "It forces all operations into one giant function"
            }, 0, "Modularity", "Decomposition reduces complexity and eases verification."));
            list.add(new QuestionTemplate("Which practice helps beginners avoid basic mistakes in " + topic + "?", new String[]{
                    "Validating boundary inputs and checking clear documentation",
                    "Ignoring compiler or runtime error messages",
                    "Never testing with realistic sample values",
                    "Storing temporary state inside global variables only"
            }, 0, "Basic Best Practices", "Input validation and clear specs prevent introductory errors."));
            list.add(new QuestionTemplate("How should foundational concepts in " + topic + " typically be verified?", new String[]{
                    "Through simple worked examples and unit checks",
                    "By deploying directly to live users without testing",
                    "By deleting assertion checks from tests",
                    "Only by guessing average output times"
            }, 0, "Verification Basics", "Worked examples confirm foundational understanding."));
        } else if ("Hard".equalsIgnoreCase(difficulty)) {
            list.add(new QuestionTemplate("Under high scale or extreme edge-case workloads in " + topic + "; which failure pattern is MOST critical to guard against?", new String[]{
                    "Hidden bottleneck amplification; unhandled boundary states; and cascading retries",
                    "Using descriptive identifier names in source modules",
                    "Keeping documentation next to interfaces",
                    "Separating configuration values from logic"
            }, 0, "Edge-Case Resilience", "Hard engineering requires diagnosing systemic failure propagation under load."));
            list.add(new QuestionTemplate("When evaluating two competing architectures for " + topic + "; what trade-off governs senior-level selection?", new String[]{
                    "Balancing asymptotic/throughput latency against memory overhead; fault tolerance; and consistency",
                    "Choosing whichever uses more lines of boilerplate code",
                    "Eliminating logging and telemetry completely",
                    "Assuming infinite CPU and zero network jitter"
            }, 0, "Architectural Trade-offs", "Optimal design weighs latency, resource footprint, and failure semantics together."));
            list.add(new QuestionTemplate("If an advanced system using " + topic + " passes basic unit tests yet fails intermittently in production; what root cause is MOST probable?", new String[]{
                    "Race conditions; timing sensitivity; partial failures; or skewed real-world data distributions",
                    "Too many comments inside helper classes",
                    "Using UTF-8 character encoding for text",
                    "Consistent version pinning of dependencies"
            }, 0, "Production Diagnosis", "Intermittent production defects usually stem from concurrency, skew, or timeouts."));
            list.add(new QuestionTemplate("Why is preserving strict invariants crucial when optimizing " + topic + " algorithms or workflows?", new String[]{
                    "Fast execution is useless or harmful if state corruption violates correctness guarantees",
                    "Invariants prevent caching from working at all",
                    "Invariants double asymptotic Big-O complexity automatically",
                    "Invariants forbid modular abstraction boundaries"
            }, 0, "Correctness Invariants", "Optimizations must never break foundational safety invariants."));
            list.add(new QuestionTemplate("Which testing strategy BEST uncovers subtle multi-step flaws in complex " + topic + " implementations?", new String[]{
                    "Property-based fuzzing; fault injection; and adversarial boundary tests",
                    "Checking only one happy-path input manually",
                    "Testing exclusively with empty inputs",
                    "Skipping negative and error-path assertions"
            }, 0, "Adversarial Testing", "Property and boundary testing surface rare state transitions."));
            list.add(new QuestionTemplate("When refactoring a tightly coupled legacy module in " + topic + " without downtime; which technique minimizes regression risk?", new String[]{
                    "Introducing strict interface contracts; shadow/parallel verification; and incremental cutover",
                    "Rewriting everything at once without version control",
                    "Removing all error handling blocks first",
                    "Bypassing integration tests to deploy faster"
            }, 0, "Safe Refactoring", "Contract tests and staged migration prevent breaking live dependents."));
        } else {
            list.add(new QuestionTemplate("When applying " + topic + " to solve a realistic class problem; what step bridges theory and implementation effectively?", new String[]{
                    "Selecting the right pattern for the constraints and tracing a medium-sized example",
                    "Skipping design and copying arbitrary snippets without reading",
                    "Hardcoding results for one fixed input size",
                    "Removing exception handling around external I/O"
            }, 0, "Applied Problem Solving", "Choosing fit-for-purpose patterns and tracing examples builds mastery."));
            list.add(new QuestionTemplate("How do you decide between a simpler baseline method and a specialized optimization in " + topic + "?", new String[]{
                    "Measure actual bottlenecks against workload size before adding complexity",
                    "Always select the most complex algorithm regardless of data size",
                    "Avoid measuring runtime or memory behavior",
                    "Duplicate both methods and run them randomly"
            }, 0, "Comparative Analysis", "Data-driven profiling prevents premature complexity."));
            list.add(new QuestionTemplate("Suppose an implementation in " + topic + " produces wrong outputs only on sorted or reversed inputs; what should you inspect first?", new String[]{
                    "Assumptions in branching conditions; initialization; and loop termination logic",
                    "Monitor resolution and font size",
                    "Only the project README formatting",
                    "Keyboard layout settings"
            }, 0, "Debugging Workflow", "Input-order bugs point directly to loop bounds and conditional logic."));
            list.add(new QuestionTemplate("Why are cohesive interfaces valuable when multiple team members collaborate on a " + topic + " project?", new String[]{
                    "They let modules evolve internally while callers rely on stable contracts",
                    "They expose internal private data directly to every class",
                    "They disable compile-time type checking",
                    "They combine UI rendering with database DDL"
            }, 0, "Interface Design", "Stable contracts enable parallel development with minimal breakage."));
            list.add(new QuestionTemplate("What makes a distractor diagnostic helpful in practical assessments of " + topic + "?", new String[]{
                    "Tracing why an incorrect step fails clarifies exact conditions required for validity",
                    "It encourages memorizing answers without understanding mechanics",
                    "It hides root causes behind vague error strings",
                    "It avoids comparing alternatives"
            }, 0, "Conceptual Reasoning", "Understanding failure conditions strengthens applied judgment."));
            list.add(new QuestionTemplate("During code review of a " + topic + " solution; which indicator signals strong applied engineering?", new String[]{
                    "Clear handling of empty/null cases; clean helpers; and readable complexity",
                    "Deeply nested conditionals repeated four times",
                    "Silent swallowing of every caught exception",
                    "Magic numbers scattered without explanation"
            }, 0, "Code Quality", "Clean edge-case handling and modularity mark applied engineering."));
        }
        return list;
    }

    private QuestionTemplate synthesizeAspectTemplate(String topic, String difficulty, String aspect) {
        if ("Easy".equalsIgnoreCase(difficulty)) {
            return new QuestionTemplate(
                    "In introductory " + topic + ", what role does \"" + aspect + "\" primarily play?",
                    new String[]{
                            "Supports clear; reliable foundational behavior under standard inputs",
                            "Replaces all core concepts of " + topic + " completely",
                            "Prevents any verification or testing",
                            "Applies only to unrelated hardware wiring"
                    }, 0, aspect, aspect + " reinforces dependable core execution in " + topic + ".");
        }
        if ("Hard".equalsIgnoreCase(difficulty)) {
            return new QuestionTemplate(
                    "When diagnosing complex failures in " + topic + " involving \"" + aspect + "\", which engineering resolution is MOST rigorous?",
                    new String[]{
                            "Enforce explicit invariants; stress-test worst-case bounds; and isolate failure propagation",
                            "Mask failures silently and ignore latency spikes",
                            "Disable validation checks under peak contention",
                            "Rely purely on arbitrary retry loops without backoff"
                    }, 0, aspect, "Hard-level mastery requires explicit invariant checks and worst-case analysis for " + aspect + ".");
        }
        return new QuestionTemplate(
                "How should \"" + aspect + "\" be balanced when implementing a practical " + topic + " solution?",
                new String[]{
                        "Evaluate requirements carefully and verify behavior across representative cases",
                        "Hardcode fixed thresholds without analyzing workload characteristics",
                        "Ignore " + aspect + " until severe failures occur",
                        "Duplicate conflicting configurations across modules"
                }, 0, aspect, "Balanced applied design validates " + aspect + " against real requirements.");
    }

    private Set<String> buildExclusionSet(String topic, String difficulty, List<String> clientExcluded) {
        Set<String> set = new HashSet<>();
        if (clientExcluded != null) {
            for (String s : clientExcluded) {
                if (s != null && !s.isBlank()) set.add(normalizeStem(s));
            }
        }
        String key = bucketKey(topic, difficulty);
        Deque<String> recent = recentStemsByBucket.get(key);
        if (recent != null) {
            synchronized (recent) {
                set.addAll(recent);
            }
        }
        return set;
    }

    private void recordRecentStems(String topic, String difficulty, List<QuizQuestion> generated) {
        if (generated == null || generated.isEmpty()) return;
        String key = bucketKey(topic, difficulty);
        Deque<String> queue = recentStemsByBucket.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            for (QuizQuestion q : generated) {
                String stem = normalizeStem(q.getQuestionText());
                if (!stem.isEmpty() && !queue.contains(stem)) {
                    queue.addLast(stem);
                    while (queue.size() > 60) {
                        queue.removeFirst();
                    }
                }
            }
        }
    }

    private String bucketKey(String topic, String difficulty) {
        return normalizeStem(topic) + "::" + normalizeDifficulty(difficulty).toLowerCase(Locale.ROOT);
    }

    private String normalizeStem(String text) {
        if (text == null) return "";
        return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", " ").trim();
    }

    private String normalizeDifficulty(String raw) {
        if (raw == null) return "Medium";
        String d = raw.trim().toLowerCase(Locale.ROOT);
        if (d.startsWith("easy") || d.startsWith("beg")) return "Easy";
        if (d.startsWith("hard") || d.startsWith("adv") || d.startsWith("exp")) return "Hard";
        return "Medium";
    }

    private String normalizeProvider(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return (defaultProvider != null && !defaultProvider.trim().isEmpty()) ? defaultProvider.trim().toUpperCase(Locale.ROOT) : "AUTO";
        }
        String p = raw.trim().toUpperCase(Locale.ROOT);
        if (p.contains("CHATGPT") || p.contains("GPT") || p.equals("OPENAI")) return "OPENAI";
        if (p.contains("PERPLEX")) return "PERPLEXITY";
        if (p.contains("GEMINI")) return "GEMINI";
        if (p.contains("GROQ")) return "GROQ";
        if (p.contains("BUILT") || p.contains("LOCAL") || p.contains("SMART")) return "BUILT_IN";
        return "AUTO";
    }

    private List<String> resolveProviderChain(String provider) {
        if ("BUILT_IN".equals(provider)) return List.of("BUILT_IN");
        if (!"AUTO".equals(provider)) return List.of(provider, "BUILT_IN");
        return List.of("OPENAI", "PERPLEXITY", "GEMINI", "GROQ", "BUILT_IN");
    }

    private String resolveApiKey(String targetProvider, String requestedProvider, String requestApiKey) {
        if (requestApiKey != null && !requestApiKey.trim().isEmpty()) {
            if ("AUTO".equals(requestedProvider) || targetProvider.equals(requestedProvider)) {
                // If AUTO + key supplied, infer likely provider from prefix when possible
                String k = requestApiKey.trim();
                if ("AUTO".equals(requestedProvider)) {
                    if (k.startsWith("pplx-") && !"PERPLEXITY".equals(targetProvider)) return "";
                    if (k.startsWith("AIza") && !"GEMINI".equals(targetProvider)) return "";
                    if (k.startsWith("gsk_") && !"GROQ".equals(targetProvider)) return "";
                    if (k.startsWith("sk-") && !"OPENAI".equals(targetProvider)) return "";
                }
                return k;
            }
        }
        return switch (targetProvider) {
            case "OPENAI" -> openaiApiKey;
            case "PERPLEXITY" -> perplexityApiKey;
            case "GEMINI" -> geminiApiKey;
            case "GROQ" -> groqApiKey;
            default -> "";
        };
    }

    private List<String> buildModelList(String customModel, String... defaults) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (customModel != null && !customModel.trim().isEmpty()) set.add(customModel.trim());
        for (String d : defaults) set.add(d);
        return new ArrayList<>(set);
    }

    private String stripCodeFences(String rawText) {
        String s = rawText == null ? "" : rawText.trim();
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        return s.trim();
    }

    private int difficultyMarks(String difficulty) {
        if ("Hard".equalsIgnoreCase(difficulty)) return 15;
        if ("Easy".equalsIgnoreCase(difficulty)) return 5;
        return 10;
    }
}
