package com.smarttimetable.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiTimetableParserService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> DAYS = Arrays.asList(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    );

    public Map<String, Object> parseTimetableFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        boolean isPdf = contentType.contains("pdf") || originalName.endsWith(".pdf");

        byte[] imageBytes;
        String imageMime;
        Map<String, List<Map<String, String>>> pdfTextGrid = null;

        if (isPdf) {
            try (PDDocument document = PDDocument.load(file.getBytes())) {
                if (document.getNumberOfPages() == 0) {
                    throw new IllegalArgumentException("PDF file has no pages.");
                }
                PDFRenderer renderer = new PDFRenderer(document);
                BufferedImage rendered = renderer.renderImageWithDPI(0, 200);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(rendered, "png", baos);
                imageBytes = baos.toByteArray();
                imageMime = "image/png";

                pdfTextGrid = extractGridFromPdfText(document);
            }
        } else {
            imageBytes = file.getBytes();
            imageMime = (contentType.startsWith("image/")) ? contentType : "image/png";
        }

        String previewImageDataUrl = "data:" + imageMime + ";base64," + Base64.getEncoder().encodeToString(imageBytes);

        // 1. If PDF contained structured day rows in selectable text, return immediately
        if (pdfTextGrid != null && !pdfTextGrid.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("data", pdfTextGrid);
            result.put("previewImage", previewImageDataUrl);
            result.put("extractionMode", "PDF_TEXT");
            result.put("needsClientOcr", false);
            return result;
        }

        // 2. If Gemini API key is configured, extract via Gemini Vision
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                String jsonText = callGeminiVision(imageBytes, imageMime);
                Map<String, Object> parsed = objectMapper.readValue(jsonText, new TypeReference<Map<String, Object>>() {});
                parsed.putIfAbsent("previewImage", previewImageDataUrl);
                parsed.put("extractionMode", "GEMINI_AI");
                parsed.put("needsClientOcr", false);
                return parsed;
            } catch (Exception ex) {
                System.err.println("[AiTimetableParser] Gemini vision failed, falling back to client OCR: " + ex.getMessage());
            }
        }

        // 3. Fallback: return rendered/uploaded image for browser Tesseract OCR + visual verification
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("data", null);
        fallback.put("previewImage", previewImageDataUrl);
        fallback.put("extractionMode", isPdf ? "PDF_IMAGE_OCR" : "IMAGE_OCR");
        fallback.put("needsClientOcr", true);
        return fallback;
    }

    public String parseTimetableImage(MultipartFile imageFile) throws Exception {
        return objectMapper.writeValueAsString(parseTimetableFile(imageFile));
    }

    private String callGeminiVision(byte[] imageBytes, String mimeType) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", base64Image);

        Map<String, Object> inlinePart = new HashMap<>();
        inlinePart.put("inlineData", inlineData);

        Map<String, Object> textPart = new HashMap<>();
        String prompt = "Extract the timetable information from this image. "
                + "Return ONLY a valid JSON format. The JSON should be an object containing a single key 'data'. "
                + "The 'data' key should contain an object where keys are the Days of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday) "
                + "and the values are an array of 7 objects representing the 7 periods. "
                + "If a period is a break (Tea Break/Lunch Break), or empty, output it as FREE. "
                + "Each period object must have exactly these keys: "
                + "'sub' (subject name or shortcode), 'code' (subject code, can be empty), "
                + "'faculty' (teacher name), 'venue' (room number). "
                + "Leave them empty strings if not found. If it's a break/free, 'sub' should be 'FREE'. "
                + "DO NOT include markdown formatting like ```json in the output, just raw JSON.";
        textPart.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", Arrays.asList(textPart, inlinePart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(parts));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                if (resParts != null && !resParts.isEmpty()) {
                    String jsonText = ((String) resParts.get(0).get("text")).trim();
                    if (jsonText.startsWith("```json")) jsonText = jsonText.substring(7);
                    if (jsonText.startsWith("```")) jsonText = jsonText.substring(3);
                    if (jsonText.endsWith("```")) jsonText = jsonText.substring(0, jsonText.length() - 3);
                    return jsonText.trim();
                }
            }
        }
        throw new Exception("Failed to parse image from Gemini API.");
    }

    private static class WordToken {
        float x;
        float y;
        float endX;
        String text;

        WordToken(float x, float y, float endX, String text) {
            this.x = x;
            this.y = y;
            this.endX = endX;
            this.text = text;
        }
    }

    private Map<String, List<Map<String, String>>> extractGridFromPdfText(PDDocument document) throws IOException {
        List<WordToken> tokens = new ArrayList<>();

        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                if (textPositions == null || textPositions.isEmpty() || text == null || text.trim().isEmpty()) {
                    return;
                }
                TextPosition first = textPositions.get(0);
                TextPosition last = textPositions.get(textPositions.size() - 1);
                tokens.add(new WordToken(
                        first.getXDirAdj(),
                        first.getYDirAdj(),
                        last.getXDirAdj() + last.getWidthDirAdj(),
                        text.trim()
                ));
            }
        };
        stripper.setStartPage(1);
        stripper.setEndPage(1);
        stripper.getText(document);

        if (tokens.size() < 6) {
            return null;
        }

        // Group tokens into horizontal rows by Y coordinate (within 8pt)
        tokens.sort(Comparator.comparingDouble((WordToken t) -> t.y).thenComparingDouble(t -> t.x));
        List<List<WordToken>> rows = new ArrayList<>();
        for (WordToken t : tokens) {
            if (rows.isEmpty() || Math.abs(rows.get(rows.size() - 1).get(0).y - t.y) > 8.0f) {
                List<WordToken> row = new ArrayList<>();
                row.add(t);
                rows.add(row);
            } else {
                rows.get(rows.size() - 1).add(t);
            }
        }

        // Find rows matching day names
        Map<String, List<WordToken>> dayRows = new LinkedHashMap<>();
        float minDayContentX = Float.MAX_VALUE;
        float maxDayContentX = 0f;

        for (List<WordToken> row : rows) {
            row.sort(Comparator.comparingDouble(t -> t.x));
            String joined = row.stream().map(t -> t.text).reduce((a, b) -> a + " " + b).orElse("");
            String matchedDay = detectDayName(joined);
            if (matchedDay != null && !dayRows.containsKey(matchedDay)) {
                dayRows.put(matchedDay, row);
                for (int i = 1; i < row.size(); i++) {
                    minDayContentX = Math.min(minDayContentX, row.get(i).x);
                    maxDayContentX = Math.max(maxDayContentX, row.get(i).endX);
                }
            }
        }

        if (dayRows.isEmpty()) {
            return null;
        }

        // Detect column boundaries from header row if present, else divide evenly into 7 periods
        float[] periodCenters = detectPeriodCenters(rows, minDayContentX, maxDayContentX);

        Map<String, List<Map<String, String>>> grid = new LinkedHashMap<>();
        for (String day : DAYS) {
            List<Map<String, String>> periods = new ArrayList<>();
            for (int p = 0; p < 7; p++) {
                periods.add(makeCell("FREE", "", ""));
            }

            List<WordToken> rowTokens = dayRows.get(day);
            if (rowTokens != null && rowTokens.size() > 1) {
                // Skip first token if it is the day name itself
                int startIdx = detectDayName(rowTokens.get(0).text) != null ? 1 : 0;
                List<StringBuilder> buckets = new ArrayList<>();
                for (int p = 0; p < 7; p++) buckets.add(new StringBuilder());

                for (int i = startIdx; i < rowTokens.size(); i++) {
                    WordToken tok = rowTokens.get(i);
                    String upper = tok.text.toUpperCase();
                    if (upper.equals("TEA") || upper.equals("BREAK") || upper.equals("LUNCH") || upper.equals("TEA BREAK") || upper.equals("LUNCH BREAK")) {
                        continue;
                    }
                    int nearestCol = 0;
                    float bestDist = Float.MAX_VALUE;
                    float center = (tok.x + tok.endX) / 2f;
                    for (int p = 0; p < 7; p++) {
                        float dist = Math.abs(center - periodCenters[p]);
                        if (dist < bestDist) {
                            bestDist = dist;
                            nearestCol = p;
                        }
                    }
                    if (buckets.get(nearestCol).length() > 0) buckets.get(nearestCol).append(" ");
                    buckets.get(nearestCol).append(tok.text);
                }

                for (int p = 0; p < 7; p++) {
                    String raw = buckets.get(p).toString().trim();
                    if (!raw.isEmpty() && !raw.equals("-") && !raw.equalsIgnoreCase("FREE")) {
                        periods.set(p, parseCellText(raw));
                    }
                }
            }
            grid.put(day, periods);
        }

        return grid;
    }

    private float[] detectPeriodCenters(List<List<WordToken>> rows, float minX, float maxX) {
        float[] centers = new float[7];
        if (minX < maxX) {
            float step = (maxX - minX) / 7f;
            for (int p = 0; p < 7; p++) {
                centers[p] = minX + step * (p + 0.5f);
            }
        } else {
            for (int p = 0; p < 7; p++) centers[p] = 100f + p * 70f;
        }

        // Look for header row containing numbers 1..7 or P1..P7
        for (List<WordToken> row : rows) {
            Map<Integer, Float> found = new HashMap<>();
            for (WordToken t : row) {
                String clean = t.text.trim().toUpperCase().replace("P", "");
                if (clean.matches("^[1-7]$")) {
                    found.put(Integer.parseInt(clean), (t.x + t.endX) / 2f);
                }
            }
            if (found.size() >= 5) {
                for (int p = 1; p <= 7; p++) {
                    if (found.containsKey(p)) centers[p - 1] = found.get(p);
                }
                break;
            }
        }
        return centers;
    }

    private String detectDayName(String text) {
        if (text == null) return null;
        String lower = text.trim().toLowerCase();
        if (lower.startsWith("mon")) return "Monday";
        if (lower.startsWith("tue")) return "Tuesday";
        if (lower.startsWith("wed")) return "Wednesday";
        if (lower.startsWith("thu")) return "Thursday";
        if (lower.startsWith("fri")) return "Friday";
        if (lower.startsWith("sat")) return "Saturday";
        Pattern dayNum = Pattern.compile("^(?:day\\s*)?([1-6])\\b");
        Matcher m = dayNum.matcher(lower);
        if (m.find()) {
            return DAYS.get(Integer.parseInt(m.group(1)) - 1);
        }
        return null;
    }

    private Map<String, String> parseCellText(String raw) {
        String[] parts = raw.split("[,|/]+");
        String sub = parts.length > 0 ? parts[0].trim() : raw;
        String faculty = parts.length > 1 ? parts[1].trim() : "";
        String venue = parts.length > 2 ? parts[2].trim() : "";
        return makeCell(sub, faculty, venue);
    }

    private Map<String, String> makeCell(String sub, String faculty, String venue) {
        Map<String, String> cell = new LinkedHashMap<>();
        cell.put("sub", sub);
        cell.put("code", "");
        cell.put("faculty", faculty);
        cell.put("venue", venue);
        return cell;
    }
}
