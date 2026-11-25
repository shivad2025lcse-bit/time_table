package com.smarttimetable.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.geom.Point2D;
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
        PdfParseResult pdfParsed = null;

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

                pdfParsed = extractFromPdf(document);
            }
        } else {
            imageBytes = file.getBytes();
            imageMime = (contentType.startsWith("image/")) ? contentType : "image/png";
        }

        String previewImageDataUrl = "data:" + imageMime + ";base64," + Base64.getEncoder().encodeToString(imageBytes);

        if (pdfParsed != null && pdfParsed.grid != null && !pdfParsed.grid.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("data", pdfParsed.grid);
            result.put("metadata", pdfParsed.metadata);
            result.put("previewImage", previewImageDataUrl);
            result.put("extractionMode", "PDF_TEXT");
            result.put("needsClientOcr", false);
            return result;
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                String jsonText = callGeminiVision(imageBytes, imageMime);
                Map<String, Object> parsed = objectMapper.readValue(jsonText, new TypeReference<Map<String, Object>>() {});
                parsed.putIfAbsent("previewImage", previewImageDataUrl);
                if (pdfParsed != null && !pdfParsed.metadata.isEmpty()) {
                    parsed.put("metadata", pdfParsed.metadata);
                }
                parsed.put("extractionMode", "GEMINI_AI");
                parsed.put("needsClientOcr", false);
                return parsed;
            } catch (Exception ex) {
                System.err.println("[AiTimetableParser] Gemini vision failed, falling back to client OCR: " + ex.getMessage());
            }
        }

        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("data", null);
        if (pdfParsed != null && !pdfParsed.metadata.isEmpty()) {
            fallback.put("metadata", pdfParsed.metadata);
        }
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

    // ── Geometry & Word Data Structures ───────────────────────────────────────

    private static class PdfParseResult {
        Map<String, List<Map<String, String>>> grid;
        Map<String, String> metadata = new LinkedHashMap<>();
    }

    private static class WordToken {
        float x;
        float endX;
        float y;
        String text;

        WordToken(float x, float endX, float y, String text) {
            this.x = x;
            this.endX = endX;
            this.y = y;
            this.text = text;
        }

        float centerX() {
            return (x + endX) / 2f;
        }
    }

    private static class HLine {
        float x1, x2, y;
        HLine(float x1, float x2, float y) {
            this.x1 = Math.min(x1, x2);
            this.x2 = Math.max(x1, x2);
            this.y = y;
        }
        float length() { return x2 - x1; }
    }

    private static class VLine {
        float x, y1, y2;
        VLine(float x, float y1, float y2) {
            this.x = x;
            this.y1 = Math.min(y1, y2);
            this.y2 = Math.max(y1, y2);
        }
        float length() { return y2 - y1; }
    }

    private static class GridGeometryExtractor extends PDFGraphicsStreamEngine {
        private final float cropLeft;
        private final float cropTop;
        final List<HLine> horizLines = new ArrayList<>();
        final List<VLine> vertLines = new ArrayList<>();
        private final List<float[]> pendingSegments = new ArrayList<>();
        private Point2D currentPt;
        private Point2D startPt;

        GridGeometryExtractor(PDPage page) {
            super(page);
            PDRectangle crop = page.getCropBox();
            this.cropLeft = crop.getLowerLeftX();
            this.cropTop = crop.getUpperRightY();
        }

        private Point2D.Float transformPt(double x, double y) {
            Point2D.Float transformed = new Point2D.Float();
            getGraphicsState().getCurrentTransformationMatrix()
                    .createAffineTransform()
                    .transform(new Point2D.Double(x, y), transformed);
            return new Point2D.Float(transformed.x - cropLeft, cropTop - transformed.y);
        }

        void extract() throws IOException {
            processPage(getPage());
        }

        @Override
        public void appendRectangle(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
            Point2D.Float a = transformPt(p0.getX(), p0.getY());
            Point2D.Float b = transformPt(p1.getX(), p1.getY());
            Point2D.Float c = transformPt(p2.getX(), p2.getY());
            Point2D.Float d = transformPt(p3.getX(), p3.getY());
            float minX = Math.min(Math.min(a.x, b.x), Math.min(c.x, d.x));
            float maxX = Math.max(Math.max(a.x, b.x), Math.max(c.x, d.x));
            float minY = Math.min(Math.min(a.y, b.y), Math.min(c.y, d.y));
            float maxY = Math.max(Math.max(a.y, b.y), Math.max(c.y, d.y));
            float w = maxX - minX;
            float h = maxY - minY;

            if (h <= 4.0f && w > 8f) {
                horizLines.add(new HLine(minX, maxX, (minY + maxY) / 2f));
            } else if (w <= 4.0f && h > 6f) {
                vertLines.add(new VLine((minX + maxX) / 2f, minY, maxY));
            } else {
                pendingSegments.add(new float[]{minX, minY, maxX, minY});
                pendingSegments.add(new float[]{minX, maxY, maxX, maxY});
                pendingSegments.add(new float[]{minX, minY, minX, maxY});
                pendingSegments.add(new float[]{maxX, minY, maxX, maxY});
            }
        }

        @Override public void drawImage(PDImage pdImage) {}
        @Override public void clip(int windingRule) {}

        @Override
        public void moveTo(float x, float y) {
            currentPt = transformPt(x, y);
            startPt = currentPt;
        }

        @Override
        public void lineTo(float x, float y) {
            Point2D next = transformPt(x, y);
            if (currentPt != null) {
                pendingSegments.add(new float[]{(float) currentPt.getX(), (float) currentPt.getY(), (float) next.getX(), (float) next.getY()});
            }
            currentPt = next;
        }

        @Override public void curveTo(float x1, float y1, float x2, float y2, float x3, float y3) {
            currentPt = transformPt(x3, y3);
        }

        @Override public Point2D getCurrentPoint() { return currentPt; }

        @Override
        public void closePath() {
            if (currentPt != null && startPt != null) {
                pendingSegments.add(new float[]{(float) currentPt.getX(), (float) currentPt.getY(), (float) startPt.getX(), (float) startPt.getY()});
                currentPt = startPt;
            }
        }

        @Override public void endPath() { pendingSegments.clear(); }

        @Override
        public void strokePath() {
            for (float[] seg : pendingSegments) {
                float dx = Math.abs(seg[2] - seg[0]);
                float dy = Math.abs(seg[3] - seg[1]);
                if (dy <= 2.5f && dx > 8f) {
                    horizLines.add(new HLine(seg[0], seg[2], (seg[1] + seg[3]) / 2f));
                } else if (dx <= 2.5f && dy > 6f) {
                    vertLines.add(new VLine((seg[0] + seg[2]) / 2f, seg[1], seg[3]));
                }
            }
            pendingSegments.clear();
        }

        @Override public void fillPath(int windingRule) { pendingSegments.clear(); }
        @Override public void fillAndStrokePath(int windingRule) { strokePath(); }
        @Override public void shadingFill(COSName shadingName) {}
    }

    // ── Main PDF Extractor ────────────────────────────────────────────────────

    private PdfParseResult extractFromPdf(PDDocument document) throws IOException {
        PdfParseResult res = new PdfParseResult();
        PDPage page = document.getPage(0);
        float pageWidth = page.getCropBox().getWidth();

        // 1. Extract drawn horizontal & vertical table lines
        GridGeometryExtractor geom = new GridGeometryExtractor(page);
        geom.extract();

        // 2. Extract word-level non-rotated text tokens (splitting by word spaces/gaps)
        List<WordToken> tokens = new ArrayList<>();
        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                if (textPositions == null || textPositions.isEmpty()) return;
                StringBuilder word = new StringBuilder();
                float startX = 0f, endX = 0f, avgY = 0f;
                int count = 0;
                TextPosition prev = null;

                for (TextPosition tp : textPositions) {
                    // Skip rotated vertical text (e.g. Tea Break / Lunch Break)
                    if (Math.abs(tp.getDir()) > 1f) continue;
                    String ch = tp.getUnicode();
                    if (ch == null || ch.trim().isEmpty()) {
                        if (word.length() > 0) {
                            tokens.add(new WordToken(startX, endX, avgY / count, word.toString().trim()));
                            word.setLength(0);
                            count = 0;
                            avgY = 0f;
                        }
                        prev = null;
                        continue;
                    }
                    float x = tp.getXDirAdj();
                    float w = Math.max(0.5f, tp.getWidthDirAdj());
                    float y = tp.getYDirAdj();
                    if (prev != null && (x - (prev.getXDirAdj() + prev.getWidthDirAdj())) > Math.max(2.5f, tp.getWidthOfSpace() * 0.55f)) {
                        if (word.length() > 0) {
                            tokens.add(new WordToken(startX, endX, avgY / count, word.toString().trim()));
                            word.setLength(0);
                            count = 0;
                            avgY = 0f;
                        }
                    }
                    if (count == 0) {
                        startX = x;
                    }
                    endX = x + w;
                    avgY += y;
                    count++;
                    word.append(ch);
                    prev = tp;
                }
                if (word.length() > 0) {
                    tokens.add(new WordToken(startX, endX, avgY / count, word.toString().trim()));
                }
            }
        };
        stripper.setStartPage(1);
        stripper.setEndPage(1);
        stripper.getText(document);

        if (tokens.size() < 6) {
            return res;
        }

        // 3. Find the 6 Day rows in the leftmost column
        Map<String, WordToken> dayTokens = new LinkedHashMap<>();
        List<WordToken> leftCandidates = new ArrayList<>(tokens);
        leftCandidates.sort(Comparator.comparingDouble((WordToken t) -> t.y).thenComparingDouble(t -> t.x));
        for (WordToken t : leftCandidates) {
            if (t.x > pageWidth * 0.30f) continue;
            String day = detectExactDayName(t.text);
            if (day != null && !dayTokens.containsKey(day)) {
                dayTokens.put(day, t);
            }
        }
        if (dayTokens.isEmpty()) {
            return res;
        }

        // Sort found days by Y position
        List<Map.Entry<String, WordToken>> orderedDays = new ArrayList<>(dayTokens.entrySet());
        orderedDays.sort(Comparator.comparingDouble(e -> e.getValue().y));

        // 4. Determine day column right border & row [topY, bottomY] bounds from horizontal grid lines
        float avgRowStep = orderedDays.size() > 1
                ? (orderedDays.get(orderedDays.size() - 1).getValue().y - orderedDays.get(0).getValue().y) / (orderedDays.size() - 1)
                : 25f;
        float approxFirstY = orderedDays.get(0).getValue().y;
        float approxLastY = orderedDays.get(orderedDays.size() - 1).getValue().y;

        float dayColCenterX = orderedDays.get(0).getValue().centerX();
        float dayColRightX = orderedDays.get(0).getValue().endX + 6f;
        for (VLine vl : geom.vertLines) {
            if (vl.x > orderedDays.get(0).getValue().endX && vl.x < pageWidth * 0.30f
                    && vl.y1 <= approxFirstY && vl.y2 >= approxLastY - 5f) {
                dayColRightX = vl.x;
                break;
            }
        }

        // Collect unique horizontal row border Ys crossing the Day column or wide table spans (handles Tea/Lunch split lines)
        List<HLine> dayRowLines = new ArrayList<>();
        for (HLine hl : geom.horizLines) {
            boolean coversDayCol = hl.x1 <= dayColCenterX + 4f && hl.x2 >= dayColRightX - 4f && hl.length() >= 30f;
            boolean wideLine = hl.length() >= pageWidth * 0.14f;
            if ((coversDayCol || wideLine) && hl.y >= approxFirstY - avgRowStep * 1.4f && hl.y <= approxLastY + avgRowStep * 1.4f) {
                dayRowLines.add(hl);
            }
        }
        dayRowLines.sort(Comparator.comparingDouble(h -> h.y));
        List<Float> rowBorderYs = new ArrayList<>();
        for (HLine hl : dayRowLines) {
            if (rowBorderYs.isEmpty() || Math.abs(rowBorderYs.get(rowBorderYs.size() - 1) - hl.y) > 2.0f) {
                rowBorderYs.add(hl.y);
            }
        }

        Map<String, float[]> dayRowBounds = new LinkedHashMap<>();
        for (int i = 0; i < orderedDays.size(); i++) {
            String day = orderedDays.get(i).getKey();
            float dy = orderedDays.get(i).getValue().y;

            float topY = Float.NaN;
            float botY = Float.NaN;
            for (float hy : rowBorderYs) {
                if (hy < dy - 2f && hy >= dy - avgRowStep * 1.15f) {
                    topY = hy; // closest border above dy
                }
                if (hy > dy + 2f && hy <= dy + avgRowStep * 1.15f && Float.isNaN(botY)) {
                    botY = hy; // first border below dy
                }
            }
            if (Float.isNaN(topY)) {
                topY = (i > 0) ? (orderedDays.get(i - 1).getValue().y + dy) / 2f : (dy - avgRowStep / 2f);
            }
            if (Float.isNaN(botY)) {
                botY = (i + 1 < orderedDays.size()) ? (dy + orderedDays.get(i + 1).getValue().y) / 2f : (dy + avgRowStep / 2f);
            }
            dayRowBounds.put(day, new float[]{topY, botY});
        }

        float firstRowTopY = dayRowBounds.get(orderedDays.get(0).getKey())[0];
        float lastRowBotY = dayRowBounds.get(orderedDays.get(orderedDays.size() - 1).getKey())[1];

        // 5. Find Period 1..7 header tokens above Monday and build exact column bounds [left, right]
        float[] colLeft = new float[7];
        float[] colRight = new float[7];

        WordToken[] headerTokens = findPeriodHeaderTokens(tokens, firstRowTopY, dayColRightX);
        float tableRightX = pageWidth * 0.94f;
        for (HLine hl : geom.horizLines) {
            if ((Math.abs(hl.y - firstRowTopY) <= 5f || Math.abs(hl.y - lastRowBotY) <= 5f) && hl.length() >= pageWidth * 0.25f) {
                tableRightX = Math.max(tableRightX, hl.x2);
            }
        }

        // Collect all vertical lines that span the header/grid region
        List<VLine> gridVerts = new ArrayList<>(geom.vertLines);
        gridVerts.sort(Comparator.comparingDouble(v -> v.x));

        if (headerTokens != null) {
            for (int p = 0; p < 7; p++) {
                float px = headerTokens[p].centerX();
                float py = headerTokens[p].y;
                float bestL = Float.NaN;
                float bestR = Float.NaN;
                for (VLine vl : gridVerts) {
                    // Must cross near the header or timetable grid
                    if (vl.y2 < py - 15f || vl.y1 > lastRowBotY + 5f) continue;
                    if (vl.x < px - 1f) {
                        bestL = vl.x;
                    } else if (vl.x > px + 1f && Float.isNaN(bestR)) {
                        bestR = vl.x;
                    }
                }
                colLeft[p] = Float.isNaN(bestL) ? (p == 0 ? dayColRightX : (headerTokens[p - 1].centerX() + px) / 2f) : bestL;
                colRight[p] = Float.isNaN(bestR) ? (p == 6 ? tableRightX : (px + headerTokens[p + 1].centerX()) / 2f) : bestR;
            }
        } else {
            float step = (tableRightX - dayColRightX) / 7f;
            for (int p = 0; p < 7; p++) {
                colLeft[p] = dayColRightX + p * step;
                colRight[p] = dayColRightX + (p + 1) * step;
            }
        }

        // 6. Extract metadata above Monday + reference table below Saturday
        res.metadata = extractMetadata(tokens, firstRowTopY);
        Map<String, String[]> refLookup = extractReferenceTable(tokens, lastRowBotY, geom.horizLines, geom.vertLines);

        // 7. Extract every day's cells, honoring merged (colspan) cells via vertical line detection!
        Map<String, List<Map<String, String>>> grid = new LinkedHashMap<>();
        for (String day : DAYS) {
            List<Map<String, String>> periods = new ArrayList<>();
            for (int p = 0; p < 7; p++) periods.add(makeCell("FREE", "", ""));

            float[] rowY = dayRowBounds.get(day);
            if (rowY == null) {
                grid.put(day, periods);
                continue;
            }
            float topY = rowY[0];
            float botY = rowY[1];

            // Collect tokens strictly inside this day's row band and to the right of Day column
            List<WordToken> rowTokens = new ArrayList<>();
            for (WordToken t : tokens) {
                if (t.y >= topY + 1f && t.y <= botY - 1f && t.centerX() >= colLeft[0] - 2f) {
                    // Exclude Tea Break / Lunch Break columns if gaps exist between P2/P3 or P4/P5
                    if (colRight[1] + 6f < colLeft[2] && t.centerX() > colRight[1] + 1f && t.centerX() < colLeft[2] - 1f) {
                        continue;
                    }
                    if (colRight[3] + 6f < colLeft[4] && t.centerX() > colRight[3] + 1f && t.centerX() < colLeft[4] - 1f) {
                        continue;
                    }
                    rowTokens.add(t);
                }
            }

            // Build merged column groups [startP..endP] by checking vertical borders inside [topY, botY]
            List<int[]> groups = new ArrayList<>();
            int gStart = 0;
            for (int p = 0; p < 6; p++) {
                boolean hasBreakGap = Math.abs(colLeft[p + 1] - colRight[p]) >= 6f;
                float dividerX = (colRight[p] + colLeft[p + 1]) / 2f;
                boolean hasDivider = hasBreakGap || hasVerticalDividerInRow(gridVerts, dividerX, topY, botY);
                if (hasDivider) {
                    groups.add(new int[]{gStart, p});
                    gStart = p + 1;
                }
            }
            groups.add(new int[]{gStart, 6});

            for (int[] grp : groups) {
                int sP = grp[0];
                int eP = grp[1];
                float cellL = colLeft[sP];
                float cellR = colRight[eP];

                List<WordToken> cellTokens = new ArrayList<>();
                for (WordToken t : rowTokens) {
                    if (t.centerX() >= cellL - 2f && t.centerX() <= cellR + 2f) {
                        cellTokens.add(t);
                    }
                }
                if (cellTokens.isEmpty()) continue;

                cellTokens.sort((a, b) -> Math.abs(a.y - b.y) > 4.5f ? Float.compare(a.y, b.y) : Float.compare(a.x, b.x));
                StringBuilder sb = new StringBuilder();
                for (WordToken ct : cellTokens) {
                    if (sb.length() > 0) sb.append(" ");
                    sb.append(ct.text);
                }
                String raw = sb.toString().trim();
                if (raw.isEmpty() || raw.equals("-") || raw.equalsIgnoreCase("FREE")
                        || raw.equalsIgnoreCase("TEA BREAK") || raw.equalsIgnoreCase("LUNCH BREAK")) {
                    continue;
                }

                Map<String, String> cell = enrichCell(raw, refLookup, res.metadata);
                for (int p = sP; p <= eP; p++) {
                    periods.set(p, new LinkedHashMap<>(cell));
                }
            }

            grid.put(day, periods);
        }

        res.grid = grid;
        return res;
    }

    private boolean hasVerticalDividerInRow(List<VLine> verts, float boundaryX, float topY, float botY) {
        float rowH = Math.max(8f, botY - topY);
        for (VLine v : verts) {
            if (Math.abs(v.x - boundaryX) <= 6.0f) {
                float overlap = Math.min(botY, v.y2) - Math.max(topY, v.y1);
                if (overlap >= rowH * 0.55f) {
                    return true;
                }
            }
        }
        return false;
    }

    private WordToken[] findPeriodHeaderTokens(List<WordToken> tokens, float firstRowTopY, float dayColRightX) {
        // Look at tokens above Monday within 110pt
        List<WordToken> candidates = new ArrayList<>();
        for (WordToken t : tokens) {
            if (t.y < firstRowTopY && t.y >= firstRowTopY - 110f && t.centerX() > dayColRightX) {
                String clean = t.text.trim().toUpperCase().replaceAll("^P", "");
                if (clean.matches("^[1-7]$")) {
                    candidates.add(t);
                }
            }
        }
        if (candidates.size() < 7) return null;

        // Group candidates by Y (within 8pt) and find a row that has 1..7 in ascending X order
        candidates.sort(Comparator.comparingDouble((WordToken t) -> t.y).thenComparingDouble(t -> t.x));
        List<List<WordToken>> yGroups = new ArrayList<>();
        for (WordToken t : candidates) {
            if (yGroups.isEmpty() || Math.abs(yGroups.get(yGroups.size() - 1).get(0).y - t.y) > 8f) {
                List<WordToken> g = new ArrayList<>();
                g.add(t);
                yGroups.add(g);
            } else {
                yGroups.get(yGroups.size() - 1).add(t);
            }
        }

        for (int gIdx = yGroups.size() - 1; gIdx >= 0; gIdx--) {
            List<WordToken> grp = yGroups.get(gIdx);
            grp.sort(Comparator.comparingDouble(t -> t.x));
            WordToken[] found = new WordToken[7];
            int matched = 0;
            for (WordToken t : grp) {
                int num = Integer.parseInt(t.text.trim().toUpperCase().replaceAll("^P", ""));
                if (found[num - 1] == null) {
                    found[num - 1] = t;
                    matched++;
                }
            }
            if (matched == 7) {
                boolean monotonic = true;
                for (int i = 0; i < 6; i++) {
                    if (found[i].centerX() >= found[i + 1].centerX()) {
                        monotonic = false;
                        break;
                    }
                }
                if (monotonic) return found;
            }
        }
        return null;
    }

    private Map<String, String> extractMetadata(List<WordToken> tokens, float firstRowTopY) {
        Map<String, String> meta = new LinkedHashMap<>();
        List<WordToken> headerTokens = new ArrayList<>();
        for (WordToken t : tokens) {
            if (t.y < firstRowTopY) headerTokens.add(t);
        }
        headerTokens.sort((a, b) -> Math.abs(a.y - b.y) > 4f ? Float.compare(a.y, b.y) : Float.compare(a.x, b.x));

        StringBuilder fullHeader = new StringBuilder();
        float lastY = -1f;
        float lastEndX = -1f;
        for (WordToken t : headerTokens) {
            boolean newLine = lastY >= 0 && (Math.abs(t.y - lastY) > 3.2f || (lastEndX >= 0 && (t.x - lastEndX) > 40f));
            if (newLine) fullHeader.append("\n");
            else if (fullHeader.length() > 0) fullHeader.append(" ");
            fullHeader.append(t.text);
            lastY = t.y;
            lastEndX = t.endX;
        }
        String text = fullHeader.toString();

        Matcher secM = Pattern.compile("\\b(I|II|III|IV)\\s+(CSE|IT|AI\\s*&\\s*DS|AI\\s*&\\s*ML|AIDS|AIML|ECE|EEE|MECH|CSBS|CIVIL)\\s+([A-Z])\\b").matcher(text);
        if (secM.find()) {
            meta.put("year", secM.group(1).trim());
            meta.put("department", secM.group(2).replaceAll("\\s+", "").toUpperCase());
            meta.put("sectionCode", secM.group(3).trim().toUpperCase());
            meta.put("sectionName", meta.get("year") + " " + meta.get("department") + " " + meta.get("sectionCode"));
        }

        Matcher advM = Pattern.compile("Class\\s*Advisor\\s*:\\s*([^\\n\\r,]+)", Pattern.CASE_INSENSITIVE).matcher(text);
        if (advM.find()) {
            meta.put("classAdvisor", advM.group(1).trim());
        }

        Matcher bracketRoomM = Pattern.compile("Classroom\\s*:\\s*\\[\\s*([^\\]\\n\\r]+?)\\s*\\]", Pattern.CASE_INSENSITIVE).matcher(text);
        if (bracketRoomM.find()) {
            meta.put("classroom", bracketRoomM.group(1).trim());
        } else {
            Matcher roomM = Pattern.compile("Classroom\\s*:\\s*([A-Za-z0-9\\s-]{2,15})", Pattern.CASE_INSENSITIVE).matcher(text);
            if (roomM.find()) {
                meta.put("classroom", roomM.group(1).trim());
            }
        }
        return meta;
    }

    private Map<String, String[]> extractReferenceTable(List<WordToken> tokens, float lastRowBotY,
                                                        List<HLine> horizLines, List<VLine> vertLines) {
        Map<String, String[]> ref = new LinkedHashMap<>();
        List<WordToken> below = new ArrayList<>();
        for (WordToken t : tokens) {
            if (t.y > lastRowBotY + 2f) below.add(t);
        }
        below.sort((a, b) -> Math.abs(a.y - b.y) > 4f ? Float.compare(a.y, b.y) : Float.compare(a.x, b.x));

        // Defaults tuned for SECE timetable PDFs
        float shortMaxX = 100f;
        float facMinX = 246f, facMaxX = 346f;
        float venueMinX = 346f, venueMaxX = 396f;
        float headerY = lastRowBotY + 2f;

        List<List<WordToken>> rows = groupIntoYRows(below, 4.5f);
        for (List<WordToken> row : rows) {
            String rowStr = joinTokens(row).toLowerCase();
            if (rowStr.contains("short name") && (rowStr.contains("faculty") || rowStr.contains("venue"))) {
                headerY = row.get(0).y;
                break;
            }
        }

        // Use vertical grid lines in the reference table to get exact column separators
        List<Float> refCols = new ArrayList<>();
        List<VLine> sortedV = new ArrayList<>(vertLines);
        sortedV.sort(Comparator.comparingDouble(v -> v.x));
        for (VLine vl : sortedV) {
            if (vl.y1 <= headerY + 40f && vl.y2 >= headerY + 25f) {
                if (refCols.isEmpty() || Math.abs(refCols.get(refCols.size() - 1) - vl.x) > 8f) {
                    refCols.add(vl.x);
                }
            }
        }
        if (refCols.size() >= 6) {
            shortMaxX = refCols.get(1);
            facMinX = refCols.get(2);
            facMaxX = refCols.get(3);
            venueMinX = refCols.get(3);
            venueMaxX = refCols.get(4);
        }

        // Find end of reference table (Timetable Coordinator / Principal footer)
        float refEndY = Float.MAX_VALUE;
        for (List<WordToken> row : rows) {
            String up = joinTokens(row).toUpperCase();
            if (row.get(0).y > headerY + 5f && (up.contains("TIMETABLE COORDINATOR") || up.contains("DEAN ACADEMICS") || up.contains("PRINCIPAL"))) {
                refEndY = row.get(0).y - 2f;
                break;
            }
        }

        // Group rows into horizontal-line-bounded Course blocks (so vertically centered Short Name & Venue apply to all sub-rows)
        List<Float> blockTops = new ArrayList<>();
        List<HLine> sortedH = new ArrayList<>(horizLines);
        sortedH.sort(Comparator.comparingDouble(h -> h.y));
        for (HLine hl : sortedH) {
            if (hl.y >= headerY + 4f && hl.y <= refEndY && hl.x1 <= shortMaxX - 10f && hl.x2 >= facMinX) {
                if (blockTops.isEmpty() || Math.abs(blockTops.get(blockTops.size() - 1) - hl.y) > 2f) {
                    blockTops.add(hl.y);
                }
            }
        }

        if (blockTops.size() >= 2) {
            for (int b = 0; b < blockTops.size() - 1; b++) {
                float bTop = blockTops.get(b);
                float bBot = blockTops.get(b + 1);
                if (bBot - bTop < 6f) continue;

                // Collect tokens inside [bTop, bBot]
                StringBuilder sCol = new StringBuilder();
                List<WordToken> blockTokens = new ArrayList<>();
                for (WordToken t : below) {
                    if (t.y > bTop + 1f && t.y < bBot - 1f) {
                        if (t.centerX() <= shortMaxX) {
                            if (sCol.length() > 0) sCol.append(" ");
                            sCol.append(t.text);
                        } else {
                            blockTokens.add(t);
                        }
                    }
                }
                String shortName = sCol.toString().trim();
                if (shortName.isEmpty()) continue;

                // Split sub-rows within block using internal horizontal dividers spanning title/faculty/venue
                List<Float> subBounds = new ArrayList<>();
                subBounds.add(bTop);
                for (HLine hl : sortedH) {
                    if (hl.y > bTop + 3f && hl.y < bBot - 3f && hl.x1 <= facMinX + 10f && hl.x2 >= facMaxX - 10f) {
                        if (Math.abs(subBounds.get(subBounds.size() - 1) - hl.y) > 2f) {
                            subBounds.add(hl.y);
                        }
                    }
                }
                subBounds.add(bBot);

                // Collect fallback venue & faculty across whole block (use primary/top line so Lab rooms don't leak into Theory rows)
                List<String> blockVenueLines = collectColLines(blockTokens, venueMinX, venueMaxX);
                String blockVenue = blockVenueLines.isEmpty() ? "" : blockVenueLines.get(0);
                String blockFaculty = cleanFacultyLines(collectColLines(blockTokens, facMinX, facMaxX));

                for (int sb = 0; sb < subBounds.size() - 1; sb++) {
                    float sTop = subBounds.get(sb);
                    float sBot = subBounds.get(sb + 1);
                    List<WordToken> subTokens = new ArrayList<>();
                    for (WordToken t : blockTokens) {
                        if (t.y > sTop + 1f && t.y < sBot - 1f) subTokens.add(t);
                    }
                    if (subTokens.isEmpty()) continue;

                    String titleStr = collectColText(subTokens, shortMaxX, facMinX).toLowerCase();
                    String fac = cleanFacultyLines(collectColLines(subTokens, facMinX, facMaxX));
                    String ven = collectColText(subTokens, venueMinX, venueMaxX);
                    if (fac.isEmpty()) fac = blockFaculty;
                    if (ven.isEmpty()) ven = blockVenue;

                    registerRefEntry(ref, shortName, titleStr, fac, ven);
                }
                if (!blockFaculty.isEmpty() || !blockVenue.isEmpty()) {
                    ref.putIfAbsent(shortName.toLowerCase(), new String[]{blockFaculty, blockVenue});
                }
            }
            return ref;
        }

        // Fallback if horizontal course-block lines are absent
        String currentShort = "";
        for (List<WordToken> row : rows) {
            if (row.get(0).y <= headerY + 2f) continue;
            if (row.get(0).y >= refEndY) break;
            String up = joinTokens(row).toUpperCase();
            if (up.contains("THEORY COURSES") || up.contains("PRACTICAL COURSES") || up.contains("ADDITIONAL HOURS")
                    || up.contains("MANDATORY COURSE") || up.contains("DEVELOPMENT COURSE")) {
                continue;
            }
            String shortName = collectColText(row, 0f, shortMaxX);
            if (!shortName.isEmpty()) currentShort = shortName;
            if (currentShort.isEmpty()) continue;

            String titleStr = collectColText(row, shortMaxX, facMinX).toLowerCase();
            String fac = cleanFacultyLines(collectColLines(row, facMinX, facMaxX));
            String ven = collectColText(row, venueMinX, venueMaxX);
            registerRefEntry(ref, currentShort, titleStr, fac, ven);
        }
        return ref;
    }

    private void registerRefEntry(Map<String, String[]> ref, String shortName, String titleStr, String fac, String ven) {
        if (fac.isEmpty() && ven.isEmpty()) return;
        String baseKey = shortName.toLowerCase();
        if (titleStr.contains("laboratory") || titleStr.contains("practical")) {
            ref.putIfAbsent((baseKey + " (practical)"), new String[]{fac, ven});
            ref.putIfAbsent((baseKey + " lab"), new String[]{fac, ven});
        } else if (titleStr.contains("project")) {
            ref.putIfAbsent((baseKey + " (project)"), new String[]{fac, ven});
        } else {
            String[] existing = ref.get(baseKey);
            if (existing == null) {
                ref.put(baseKey, new String[]{fac, ven});
            } else {
                if (existing[0].isEmpty() && !fac.isEmpty()) existing[0] = fac;
                if (existing[1].isEmpty() && !ven.isEmpty()) existing[1] = ven;
            }
        }
    }

    private String collectColText(List<WordToken> tokens, float minX, float maxX) {
        List<WordToken> hits = new ArrayList<>();
        for (WordToken t : tokens) {
            if (t.centerX() > minX && t.centerX() <= maxX) hits.add(t);
        }
        hits.sort((a, b) -> Math.abs(a.y - b.y) > 3.5f ? Float.compare(a.y, b.y) : Float.compare(a.x, b.x));
        return joinTokens(hits);
    }

    private List<String> collectColLines(List<WordToken> tokens, float minX, float maxX) {
        List<WordToken> hits = new ArrayList<>();
        for (WordToken t : tokens) {
            if (t.centerX() > minX && t.centerX() <= maxX) hits.add(t);
        }
        hits.sort((a, b) -> Math.abs(a.y - b.y) > 3.5f ? Float.compare(a.y, b.y) : Float.compare(a.x, b.x));
        List<String> lines = new ArrayList<>();
        for (List<WordToken> r : groupIntoYRows(hits, 3.5f)) {
            String s = joinTokens(r);
            if (!s.isEmpty()) lines.add(s);
        }
        return lines;
    }

    private String cleanFacultyLines(List<String> lines) {
        List<String> names = new ArrayList<>();
        for (String line : lines) {
            String cleaned = line.replaceAll(",.*$", "").trim();
            if (cleaned.isEmpty()) continue;
            // Skip continuation role descriptors such as "Aptitude Trainer" or "Softskills Trainer"
            if (!lines.isEmpty() && names.size() >= 1 && !cleaned.matches("(?i)^(dr|mr|ms|mrs|prof|respective)\\b.*")) {
                continue;
            }
            if (!names.contains(cleaned)) names.add(cleaned);
        }
        if (names.isEmpty()) return "";
        return names.get(0);
    }

    private List<List<WordToken>> groupIntoYRows(List<WordToken> tokens, float tolerance) {
        List<List<WordToken>> rows = new ArrayList<>();
        for (WordToken t : tokens) {
            if (rows.isEmpty() || Math.abs(rows.get(rows.size() - 1).get(0).y - t.y) > tolerance) {
                List<WordToken> r = new ArrayList<>();
                r.add(t);
                rows.add(r);
            } else {
                rows.get(rows.size() - 1).add(t);
            }
        }
        for (List<WordToken> r : rows) {
            r.sort(Comparator.comparingDouble(t -> t.x));
        }
        return rows;
    }

    private String joinTokens(List<WordToken> row) {
        StringBuilder sb = new StringBuilder();
        for (WordToken t : row) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(t.text);
        }
        return sb.toString().trim();
    }

    private Map<String, String> enrichCell(String raw, Map<String, String[]> refLookup, Map<String, String> meta) {
        String clean = raw.replaceAll("\\s+", " ").trim();
        String[] parts = clean.split("[,|/]+");
        String sub = parts.length > 0 ? parts[0].trim() : clean;
        String faculty = parts.length > 1 ? parts[1].trim() : "";
        String venue = parts.length > 2 ? parts[2].trim() : "";

        String[] match = refLookup.get(sub.toLowerCase());
        if (match == null) {
            // Try base name before parentheses e.g. "JAVA (Practical)" -> "java"
            String base = sub.replaceAll("\\(.*?\\)", "").trim().toLowerCase();
            match = refLookup.get(base);
        }
        if (match != null) {
            if (faculty.isEmpty() && !match[0].isEmpty()) faculty = match[0];
            if (venue.isEmpty() && !match[1].isEmpty()) venue = match[1];
        }
        if (venue.isEmpty() && meta.containsKey("classroom")) {
            venue = meta.get("classroom");
        }
        return makeCell(sub, faculty, venue);
    }

    private String detectExactDayName(String text) {
        if (text == null) return null;
        String lower = text.trim().toLowerCase();
        if (lower.equals("mon") || lower.equals("monday")) return "Monday";
        if (lower.equals("tue") || lower.equals("tues") || lower.equals("tuesday")) return "Tuesday";
        if (lower.equals("wed") || lower.equals("wednesday")) return "Wednesday";
        if (lower.equals("thu") || lower.equals("thur") || lower.equals("thurs") || lower.equals("thursday")) return "Thursday";
        if (lower.equals("fri") || lower.equals("friday")) return "Friday";
        if (lower.equals("sat") || lower.equals("saturday")) return "Saturday";
        return null;
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
