"use client";

import { ChangeEvent, DragEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";

type ScaleType = "linear" | "log";
type Locale = "ko" | "en";
type LanguagePreference = "auto" | Locale;
type ExportDelimiter = "space" | "comma" | "tab" | "semicolon";
type DataColumn = "index" | "x" | "y" | "error";
type SelectedCell = { pointId: number; column: DataColumn };
type PixelCandidate = { x: number; y: number; weight: number };
type Calibration = { x: number; y: number };
type BrushStroke = { points: Calibration[]; size: number };
type DataPoint = { id: number; px: number; py: number; x: number; y: number; yError: number | null; errorPy: number | null };
type DataSheet = { id: number; name: string; points: DataPoint[]; color: string; pickedColor: string | null };
type Snapshot = { calibrations: Calibration[]; points: DataPoint[]; calibrationIndex: number; mode: Mode; selectedPointId: number | null; selectedCells: SelectedCell[] };
type Mode = "empty" | "calibrate" | "extract";

const messages = {
  ko: {
    tagline: "그래프에서 숫자를 되찾는 가장 빠른 방법", localOnly: "로컬에서만 처리", privacyTitle: "이미지와 데이터는 이 컴퓨터를 벗어나지 않습니다.",
    language: "언어", languageAuto: "자동", languageKorean: "한국어", languageEnglish: "English",
    image: "이미지", loadFile: "파일을 불러오세요", calibration: "축 보정", calibrationDesc: "점 4개로 좌표 설정", extraction: "데이터 추출", extractionDesc: "점과 에러바 기록",
    xAxis: "X축", yAxis: "Y축", linear: "선형", log: "로그₁₀", minimum: "최솟값", maximum: "최댓값", twoAxisPositions: "축 위의 두 위치",
    calXMin: "X축 최솟값", calXMax: "X축 최댓값", calYMin: "Y축 최솟값", calYMax: "Y축 최댓값", clickValuePosition: "값 {{value}}에 해당하는 위치를 클릭",
    colorExtraction: "색상 자동 추출", brush: "브러시", fullImage: "전체 그림", autoDensity: "밀도 자동", fixed: "고정",
    extractionColor: "추출 색상 선택", colorNotSelected: "색상 미선택", graphColor: "그래프 선이나 마커의 색", cancelSelection: "선택 취소", pickFromImage: "그림에서 선택",
    colorSearchRange: "색상 검색 범위", brushArea: "브러시 영역", brushDrawing: "✓ 브러시 그리는 중", drawBrush: "✎ 브러시 그리기", clearArea: "영역 지우기",
    brushWidth: "브러시 굵기", brushCount: "{{count}}개 브러시 선이 지정됨", brushHint: "그래프에서 필요한 부분만 따라 그으세요", colorTolerance: "색상 허용 오차",
    spacingMethod: "점 간격 방식", adaptiveDensity: "자동 밀도", fixedSpacing: "고정 간격", curveSpacing: "연속 곡선 기준 간격", pointMinSpacing: "점 최소 간격",
    brushDescription: "반투명하게 칠한 범위 안에서만 선택한 색을 찾습니다. 축·범례·문자가 같은 색이어도 브러시 밖이면 제외됩니다.",
    adaptiveDescription: "그림 전체에서 같은 색을 찾습니다. 분리된 마커는 각각 한 점으로, 연속 곡선은 굽은 곳을 촘촘하게 추출합니다.",
    fixedDescription: "그림 전체를 같은 폭의 가로 구간으로 나누고 구간마다 대표점 하나를 기록합니다.",
    extractBrush: "브러시 영역 추출", extractColorPoints: "색상 점 자동 추출", recalibrate: "축 다시 보정", finishCalibration: "보정 완료 · 점 추출 시작",
    waitingImage: "이미지 대기", calibrating: "보정 {{current}}/4", extractingPoints: "점 추출", zoomOut: "축소", zoomIn: "확대", fit: "맞춤", magnifier: "⌕ 확대경",
    magnifierPower: "확대경 배율", magnifierPosition: "확대경 고정 위치", fixedRight: "우측 고정", fixedLeft: "좌측 고정", replaceImage: "이미지 교체", openImage: "이미지 열기",
    dropImage: "그래프 이미지를 여기에 놓으세요", chooseImage: "또는 클릭해서 PNG, JPG, WEBP 파일 선택", staysLocal: "파일은 이 컴퓨터 안에서만 처리됩니다",
    initialHint: "이미지를 불러오면 축 보정부터 안내합니다.", click: "클릭", addSelectPoint: "점 추가/선택", doubleClick: "더블클릭", editSelectedPoint: "선택 점 편집", yError: "Y 에러", deleteSelected: "선택 데이터 삭제", undo: "실행 취소",
    extractedData: "추출 데이터", total: "전체", clearSheet: "현재 시트 지우기", sheets: "추출 데이터 시트", addSheet: "＋ 시트", manualAndColor: "색상/수동 추출", manualNoColor: "수동 추출 · 색상 미선택",
    spreadsheet: "추출 데이터 스프레드시트", noPoints: "추출한 점이 아직 없습니다.", clickGraphPoint: "그래프 위의 데이터점을 클릭하세요.", deletePoint: "{{number}}번 점 삭제",
    cellsSelected: "{{cells}}개 셀 · {{rows}}개 데이터점 선택", selectedPoint: "선택한 점 #{{number}} · Y {{value}}", selectByCell: "셀 단위로 데이터를 선택하세요",
    multiDeleteHelp: "선택한 셀들이 속한 데이터점을 Backspace 또는 Delete로 함께 삭제할 수 있습니다.", selectedHelp: "Enter 또는 더블클릭으로 값을 편집합니다. Ctrl/⌘을 누르고 그래프를 클릭하면 이 점의 에러바를 지정합니다. 보조 클릭도 사용할 수 있습니다.", cellSelectHelp: "일반 클릭은 한 셀, Shift+클릭은 범위, Ctrl/⌘+클릭은 여러 셀을 선택합니다.",
    delimiter: "내보내기 구분자", spaceGnuplot: "스페이스 (gnuplot)", comma: "쉼표 (,)", tab: "탭", semicolon: "세미콜론 (;)", exportDat: "DAT 내보내기", exportTsv: "TSV 내보내기", exportCsv: "CSV 내보내기",
    invalidImage: "PNG, JPG, WEBP 같은 이미지 파일을 선택해 주세요.", imageLoaded: "이미지를 불러왔습니다. X축 최솟값 위치부터 클릭하세요.", imageReadFailed: "이미지를 읽지 못했습니다.",
    graphPointSelectedEdit: "그래프의 점 {{number}}을 선택했습니다. Y값을 편집하세요.", graphPointSelected: "그래프의 점 {{number}}을 선택했습니다. Ctrl+클릭으로 에러바를 지정하거나 Enter로 값을 편집하세요.",
    colorPicked: "{{color}} 색상을 선택했습니다. 허용 오차와 점 간격을 조절한 뒤 자동 추출하세요.", clickCalibration: "{{label}} 위치를 클릭하세요.", calibrationComplete: "축 보정점 4개를 모두 선택했습니다. 값과 스케일을 확인한 뒤 추출을 시작하세요.",
    addPointFirst: "먼저 일반 클릭으로 데이터점을 추가하세요.", errorRecorded: "선택한 점 {{number}}의 Y 에러를 ± {{value}}로 기록했습니다.", pointAdded: "점 {{number}}을 추가했습니다.",
    addingBrush: "브러시 영역을 추가하고 있습니다. 필요한 데이터 선이나 점 위를 따라 그으세요.", brushReady: "브러시 영역을 지정했습니다. 색상을 선택한 뒤 ‘브러시 영역 추출’을 누르세요.", undone: "마지막 작업을 취소했습니다.", pointsDeleted: "{{count}}개 데이터점을 삭제했습니다. 실행 취소로 복구할 수 있습니다.",
    needCalibration: "축 보정점 4개를 먼저 선택해 주세요.", positiveLog: "로그 축의 값은 모두 0보다 커야 합니다.", distinctCalibration: "같은 위치가 아닌 서로 다른 축 보정점을 선택해 주세요.", ready: "준비됐습니다. 데이터점을 클릭하고, 에러바 끝은 Ctrl+클릭하세요.",
    chooseColorFirst: "그래프에서 추출할 색상을 먼저 선택해 주세요.", noBrushArea: "브러시 영역이 없습니다. ‘브러시 그리기’를 켜고 추출할 부분을 먼저 칠해 주세요.", noColorPixels: "조건에 맞는 색상 픽셀을 찾지 못했습니다. 허용 오차를 조금 높여 보세요.",
    extractedAdaptive: "{{scope}}의 {{color}} 색상에서 {{count}}개 점을 색상 덩어리와 곡선 밀도에 맞춰 추출했습니다.", extractedFixed: "{{scope}}의 {{color}} 색상에서 {{count}}개 점을 고정 간격으로 추출했습니다.", noExportData: "내보낼 데이터점이 없습니다.",
    space: "스페이스", commaLabel: "쉼표", tabLabel: "탭", semicolonLabel: "세미콜론", currentSheet: "현재 시트", saveData: "{{sheet}} 데이터 저장", saveCancelled: "파일 저장을 취소했습니다.", saved: "{{sheet}}를 {{delimiter}} 구분자로 저장했습니다.", saveFailed: "파일을 저장하지 못했습니다. 다른 위치를 선택해 다시 시도해 주세요.",
    sheetSwitched: "{{sheet}} 시트로 전환했습니다. 이 시트의 데이터만 편집하고 내보냅니다.", sheetAdded: "{{sheet}} 시트를 추가했습니다. 같은 그림에서 새 데이터 계열을 추출하세요.", rangeSelected: "{{cells}}개 셀을 범위 선택했습니다. Delete로 {{rows}}개 데이터점을 삭제할 수 있습니다.", cellsChosen: "{{count}}개 셀을 선택했습니다.", cellChosen: "점 {{number}}의 {{column}} 셀을 선택했습니다.", numberColumn: "번호", errorColumn: "Y 에러",
    enterNumber: "숫자로 입력해 주세요.", positiveLogSingle: "로그 축의 값은 0보다 커야 합니다.", nonNegativeError: "에러값은 0 이상이어야 합니다.", valueEdited: "{{column}} 값을 수정했습니다.",
    pickColorPrompt: "그림에서 추출할 색상을 클릭하세요.", colorPickCancelled: "색상 선택을 취소했습니다.", scopeFull: "색상 검색 범위를 그림 전체로 설정했습니다.", brushEnabled: "브러시가 켜졌습니다. 그래프에서 추출할 부분을 드래그해 칠하세요.", brushDrag: "브러시가 켜졌습니다. 필요한 선이나 점 위를 드래그하세요.", brushLocked: "브러시를 잠갔습니다. 이제 점을 선택하거나 자동 추출할 수 있습니다.", brushCleared: "브러시 영역을 모두 지웠습니다.",
  },
  en: {
    tagline: "The fastest way to recover numbers from graphs", localOnly: "Processed locally", privacyTitle: "Your images and data never leave this computer.",
    language: "Language", languageAuto: "Auto", languageKorean: "한국어", languageEnglish: "English",
    image: "Image", loadFile: "Open a file", calibration: "Axis calibration", calibrationDesc: "Set coordinates with 4 points", extraction: "Data extraction", extractionDesc: "Record points and error bars",
    xAxis: "X axis", yAxis: "Y axis", linear: "Linear", log: "Log₁₀", minimum: "Minimum", maximum: "Maximum", twoAxisPositions: "Two positions on the axis",
    calXMin: "X-axis minimum", calXMax: "X-axis maximum", calYMin: "Y-axis minimum", calYMax: "Y-axis maximum", clickValuePosition: "Click the position corresponding to {{value}}",
    colorExtraction: "Automatic color extraction", brush: "Brush", fullImage: "Full image", autoDensity: "Adaptive density", fixed: "Fixed",
    extractionColor: "Choose extraction color", colorNotSelected: "No color selected", graphColor: "Color of the graph line or marker", cancelSelection: "Cancel", pickFromImage: "Pick from image",
    colorSearchRange: "Color search area", brushArea: "Brush area", brushDrawing: "✓ Drawing brush", drawBrush: "✎ Draw brush", clearArea: "Clear area",
    brushWidth: "Brush width", brushCount: "{{count}} brush strokes selected", brushHint: "Trace only the parts you need", colorTolerance: "Color tolerance",
    spacingMethod: "Point spacing method", adaptiveDensity: "Adaptive", fixedSpacing: "Fixed spacing", curveSpacing: "Continuous curve spacing", pointMinSpacing: "Minimum point spacing",
    brushDescription: "Finds the selected color only inside the translucent brush area. Axes, legends, and text outside the brush are excluded even if they share the color.",
    adaptiveDescription: "Finds the color across the full image. Separate markers become individual points, while curves are sampled more densely where they bend.",
    fixedDescription: "Divides the full image into equal horizontal intervals and records one representative point per interval.",
    extractBrush: "Extract brush area", extractColorPoints: "Extract color points", recalibrate: "Recalibrate axes", finishCalibration: "Finish calibration · Start extraction",
    waitingImage: "Waiting for image", calibrating: "Calibration {{current}}/4", extractingPoints: "Point extraction", zoomOut: "Zoom out", zoomIn: "Zoom in", fit: "Fit", magnifier: "⌕ Magnifier",
    magnifierPower: "Magnifier zoom", magnifierPosition: "Fixed magnifier position", fixedRight: "Fix right", fixedLeft: "Fix left", replaceImage: "Replace image", openImage: "Open image",
    dropImage: "Drop a graph image here", chooseImage: "or click to choose a PNG, JPG, or WEBP file", staysLocal: "The file is processed only on this computer",
    initialHint: "Open an image and PlotSift will guide you through axis calibration.", click: "Click", addSelectPoint: "add/select point", doubleClick: "Double-click", editSelectedPoint: "edit selected point", yError: "Y error", deleteSelected: "delete selected data", undo: "Undo",
    extractedData: "Extracted data", total: "total", clearSheet: "Clear current sheet", sheets: "Extracted data sheets", addSheet: "＋ Sheet", manualAndColor: "color/manual extraction", manualNoColor: "manual extraction · no color selected",
    spreadsheet: "Extracted data spreadsheet", noPoints: "No points have been extracted yet.", clickGraphPoint: "Click a data point on the graph.", deletePoint: "Delete point {{number}}",
    cellsSelected: "{{cells}} cells · {{rows}} data points selected", selectedPoint: "Selected point #{{number}} · Y {{value}}", selectByCell: "Select data by cell",
    multiDeleteHelp: "Press Backspace or Delete to remove all data points belonging to the selected cells.", selectedHelp: "Press Enter or double-click to edit a value. Ctrl/⌘-click the graph to set this point’s error bar. Secondary click also works.", cellSelectHelp: "Click selects one cell, Shift-click selects a range, and Ctrl/⌘-click selects multiple cells.",
    delimiter: "Export delimiter", spaceGnuplot: "Space (gnuplot)", comma: "Comma (,)", tab: "Tab", semicolon: "Semicolon (;)", exportDat: "Export DAT", exportTsv: "Export TSV", exportCsv: "Export CSV",
    invalidImage: "Choose an image file such as PNG, JPG, or WEBP.", imageLoaded: "Image loaded. Start by clicking the X-axis minimum position.", imageReadFailed: "The image could not be read.",
    graphPointSelectedEdit: "Selected graph point {{number}}. Edit its Y value.", graphPointSelected: "Selected graph point {{number}}. Ctrl-click to set its error bar or press Enter to edit.",
    colorPicked: "Selected {{color}}. Adjust tolerance and point spacing, then run automatic extraction.", clickCalibration: "Click the {{label}} position.", calibrationComplete: "All four calibration points are selected. Check the values and scales, then start extraction.",
    addPointFirst: "Add a data point with a normal click first.", errorRecorded: "Recorded Y error ± {{value}} for selected point {{number}}.", pointAdded: "Added point {{number}}.",
    addingBrush: "Adding a brush area. Drag along the data line or points you need.", brushReady: "Brush area set. Choose a color, then select ‘Extract brush area’.", undone: "Undid the last action.", pointsDeleted: "Deleted {{count}} data points. You can restore them with Undo.",
    needCalibration: "Select all four axis calibration points first.", positiveLog: "All logarithmic axis values must be greater than zero.", distinctCalibration: "Choose distinct positions for the axis calibration points.", ready: "Ready. Click data points, then Ctrl-click an error-bar endpoint.",
    chooseColorFirst: "Choose a color to extract from the graph first.", noBrushArea: "There is no brush area. Turn on ‘Draw brush’ and paint the part to extract.", noColorPixels: "No matching color pixels were found. Try increasing the color tolerance.",
    extractedAdaptive: "Extracted {{count}} points in {{color}} from the {{scope}}, adapting to color groups and curve density.", extractedFixed: "Extracted {{count}} points in {{color}} from the {{scope}} at fixed intervals.", noExportData: "There are no data points to export.",
    space: "Space", commaLabel: "Comma", tabLabel: "Tab", semicolonLabel: "Semicolon", currentSheet: "Current sheet", saveData: "Save {{sheet}} data", saveCancelled: "File saving was cancelled.", saved: "Saved {{sheet}} using a {{delimiter}} delimiter.", saveFailed: "The file could not be saved. Choose another location and try again.",
    sheetSwitched: "Switched to {{sheet}}. Only this sheet will be edited and exported.", sheetAdded: "Added {{sheet}}. Extract a new data series from the same image.", rangeSelected: "Selected a range of {{cells}} cells. Delete will remove {{rows}} data points.", cellsChosen: "Selected {{count}} cells.", cellChosen: "Selected the {{column}} cell in point {{number}}.", numberColumn: "index", errorColumn: "Y error",
    enterNumber: "Enter a number.", positiveLogSingle: "Values on a logarithmic axis must be greater than zero.", nonNegativeError: "Error values must be zero or greater.", valueEdited: "Updated the {{column}} value.",
    pickColorPrompt: "Click the color to extract from the image.", colorPickCancelled: "Color selection cancelled.", scopeFull: "Color search area set to the full image.", brushEnabled: "Brush enabled. Drag over the part of the graph to extract.", brushDrag: "Brush enabled. Drag over the lines or points you need.", brushLocked: "Brush locked. You can now select points or run automatic extraction.", brushCleared: "Cleared all brush areas.",
  },
} as const;

type MessageKey = keyof typeof messages.ko;

function resolveSystemLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}
const markerColors = ["#0f766e", "#0f766e", "#e9654b", "#e9654b"];
const seriesColors = ["#1683a5", "#d95d39", "#4d9b62", "#8b6dc1", "#d69e2e", "#c14f86"];
const dataColumns: DataColumn[] = ["index", "x", "y", "error"];

function interpolate(pixel: number, p1: number, p2: number, v1: number, v2: number, scale: ScaleType) {
  const ratio = (pixel - p1) / (p2 - p1);
  if (scale === "log") return 10 ** (Math.log10(v1) + ratio * (Math.log10(v2) - Math.log10(v1)));
  return v1 + ratio * (v2 - v1);
}

function inverseInterpolate(value: number, p1: number, p2: number, v1: number, v2: number, scale: ScaleType) {
  const ratio = scale === "log"
    ? (Math.log10(value) - Math.log10(v1)) / (Math.log10(v2) - Math.log10(v1))
    : (value - v1) / (v2 - v1);
  return p1 + ratio * (p2 - p1);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if ((abs > 0 && abs < 0.001) || abs >= 100000) return value.toExponential(5);
  return Number(value.toPrecision(7)).toString();
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { red: (value >> 16) & 255, green: (value >> 8) & 255, blue: value & 255 };
}

function simplifyAdaptive(points: PixelCandidate[], tolerance: number) {
  if (points.length <= 2) return points;
  const keep = new Set([0, points.length - 1]);
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    const first = points[start];
    const last = points[end];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const denominator = Math.hypot(dx, dy) || 1;
    let farthestIndex = -1;
    let farthestDistance = 0;
    for (let index = start + 1; index < end; index += 1) {
      const point = points[index];
      const distance = Math.abs(dy * point.x - dx * point.y + last.x * first.y - last.y * first.x) / denominator;
      if (distance > farthestDistance) { farthestDistance = distance; farthestIndex = index; }
    }
    if (farthestIndex >= 0 && farthestDistance > tolerance) {
      keep.add(farthestIndex);
      stack.push([start, farthestIndex], [farthestIndex, end]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((index) => points[index]);
}

function adaptiveCandidates(columns: PixelCandidate[], baseSpacing: number) {
  if (!columns.length) return [];
  const runs: PixelCandidate[][] = [];
  let currentRun: PixelCandidate[] = [];
  columns.forEach((point, index) => {
    if (index > 0 && point.x - columns[index - 1].x > 2) {
      if (currentRun.length) runs.push(currentRun);
      currentRun = [];
    }
    currentRun.push(point);
  });
  if (currentRun.length) runs.push(currentRun);

  const markerWidth = Math.max(6, baseSpacing * .8);
  const maximumGap = Math.max(8, baseSpacing * 2.5);
  const tolerance = Math.max(.6, baseSpacing * .07);
  const output: PixelCandidate[] = [];

  runs.forEach((run) => {
    const runWidth = run[run.length - 1].x - run[0].x + 1;
    if (runWidth <= markerWidth) {
      const totalWeight = run.reduce((sum, point) => sum + point.weight, 0);
      output.push({
        x: run.reduce((sum, point) => sum + point.x * point.weight, 0) / totalWeight,
        y: run.reduce((sum, point) => sum + point.y * point.weight, 0) / totalWeight,
        weight: totalWeight,
      });
      return;
    }

    const simplified = simplifyAdaptive(run, tolerance);
    simplified.forEach((point, index) => {
      if (index === 0) { output.push(point); return; }
      const previous = simplified[index - 1];
      const gapCount = Math.floor((point.x - previous.x) / maximumGap);
      for (let gap = 1; gap <= gapCount; gap += 1) {
        const targetX = previous.x + gap * maximumGap;
        if (targetX >= point.x) break;
        const candidate = run.reduce((nearest, item) => Math.abs(item.x - targetX) < Math.abs(nearest.x - targetX) ? item : nearest, run[0]);
        output.push(candidate);
      }
      output.push(point);
    });
  });

  const unique = new Map<string, PixelCandidate>();
  output.forEach((point) => unique.set(`${Math.round(point.x * 10)}:${Math.round(point.y * 10)}`, point));
  return [...unique.values()].sort((a, b) => a.x - b.x);
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const editorInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const nextIdRef = useRef(1);
  const nextSheetIdRef = useRef(2);
  const cancelEditRef = useRef(false);
  const errorModifierRef = useRef({ control: false, meta: false });
  const lastErrorGestureRef = useRef({ time: 0, clientX: 0, clientY: 0 });
  const brushDrawingRef = useRef(false);

  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<Mode>("empty");
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [calibrations, setCalibrations] = useState<Calibration[]>([]);
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [dataSheets, setDataSheets] = useState<DataSheet[]>([{ id: 1, name: "Series 1", points: [], color: seriesColors[0], pickedColor: null }]);
  const [activeSheetId, setActiveSheetId] = useState(1);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [editingCell, setEditingCell] = useState<SelectedCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [xMin, setXMin] = useState(0);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [xScale, setXScale] = useState<ScaleType>("linear");
  const [yScale, setYScale] = useState<ScaleType>("linear");
  const [zoom, setZoom] = useState(1);
  const [magnifierEnabled, setMagnifierEnabled] = useState(true);
  const [magnifierPower, setMagnifierPower] = useState(3);
  const [magnifierSide, setMagnifierSide] = useState<"left" | "right">("right");
  const [colorPickMode, setColorPickMode] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [colorTolerance, setColorTolerance] = useState(32);
  const [pointSpacing, setPointSpacing] = useState(24);
  const [spacingMode, setSpacingMode] = useState<"adaptive" | "fixed">("adaptive");
  const [extractionScope, setExtractionScope] = useState<"full" | "brush">("full");
  const [brushMode, setBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(36);
  const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([]);
  const [exportDelimiter, setExportDelimiter] = useState<ExportDelimiter>("space");
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [flash, setFlash] = useState("");
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>("auto");
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback((key: MessageKey, values: Record<string, string | number> = {}) => {
    let message: string = messages[locale][key];
    Object.entries(values).forEach(([name, value]) => { message = message.replaceAll(`{{${name}}}`, String(value)); });
    return message;
  }, [locale]);

  const calibrationLabels = [t("calXMin"), t("calXMax"), t("calYMin"), t("calYMax")];

  useEffect(() => {
    const stored = window.localStorage.getItem("plotsift-language")
      ?? window.localStorage.getItem("plotdrop-language");
    const preference: LanguagePreference = stored === "ko" || stored === "en" ? stored : "auto";
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLanguagePreference(preference);
      setLocale(preference === "auto" ? resolveSystemLocale() : preference);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (languagePreference !== "auto") return;
    const followSystemLanguage = () => setLocale(resolveSystemLocale());
    window.addEventListener("languagechange", followSystemLanguage);
    return () => window.removeEventListener("languagechange", followSystemLanguage);
  }, [languagePreference]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === "ko" ? "PlotSift — 로컬 그래프 Digitizer" : "PlotSift — Local Graph Digitizer";
  }, [locale]);

  const changeLanguage = (preference: LanguagePreference) => {
    setLanguagePreference(preference);
    window.localStorage.setItem("plotsift-language", preference);
    setLocale(preference === "auto" ? resolveSystemLocale() : preference);
  };

  const activeSheet = dataSheets.find((sheet) => sheet.id === activeSheetId) ?? dataSheets[0];
  const activeSheetColor = pickedColor ?? activeSheet?.color ?? seriesColors[0];

  useEffect(() => {
    if (!editingCell) return;
    requestAnimationFrame(() => {
      editorInputRef.current?.focus();
      editorInputRef.current?.select();
    });
  }, [editingCell]);

  useEffect(() => {
    const rememberModifier = (event: KeyboardEvent) => {
      if (event.key === "Control") errorModifierRef.current.control = event.type === "keydown";
      if (event.key === "Meta") errorModifierRef.current.meta = event.type === "keydown";
    };
    const clearModifiers = () => { errorModifierRef.current = { control: false, meta: false }; };
    window.addEventListener("keydown", rememberModifier);
    window.addEventListener("keyup", rememberModifier);
    window.addEventListener("blur", clearModifiers);
    return () => {
      window.removeEventListener("keydown", rememberModifier);
      window.removeEventListener("keyup", rememberModifier);
      window.removeEventListener("blur", clearModifiers);
    };
  }, []);

  const isCalibrationValid = calibrations.length === 4;
  const scaleValuesValid = xScale === "linear" || (xMin > 0 && xMax > 0);
  const yScaleValuesValid = yScale === "linear" || (yMin > 0 && yMax > 0);

  const snapshot = useCallback(() => {
    historyRef.current.push({ calibrations: calibrations.map((p) => ({ ...p })), points: points.map((p) => ({ ...p })), calibrationIndex, mode, selectedPointId, selectedCells: selectedCells.map((cell) => ({ ...cell })) });
    if (historyRef.current.length > 80) historyRef.current.shift();
  }, [calibrations, points, calibrationIndex, mode, selectedPointId, selectedCells]);

  const pixelToValue = useCallback((px: number, py: number) => {
    if (calibrations.length < 4 || !scaleValuesValid || !yScaleValuesValid) return null;
    return {
      x: interpolate(px, calibrations[0].x, calibrations[1].x, xMin, xMax, xScale),
      y: interpolate(py, calibrations[2].y, calibrations[3].y, yMin, yMax, yScale),
    };
  }, [calibrations, scaleValuesValid, yScaleValuesValid, xMin, xMax, yMin, yMax, xScale, yScale]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    calibrations.forEach((point, index) => {
      const radius = Math.max(7, canvas.width / 110);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = markerColors[index];
      ctx.fill();
      ctx.lineWidth = Math.max(2, canvas.width / 600);
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${Math.max(10, canvas.width / 90)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), point.x, point.y);
    });

    brushStrokes.forEach((stroke) => {
      if (!stroke.points.length) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(15, 118, 110, .22)";
      ctx.fillStyle = "rgba(15, 118, 110, .22)";
      ctx.lineWidth = stroke.size;
      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      }
      ctx.restore();
    });

    dataSheets.filter((sheet) => sheet.id !== activeSheetId).forEach((sheet) => {
      sheet.points.forEach((point) => {
        const radius = Math.max(4, canvas.width / 185);
        if (point.errorPy !== null) {
          ctx.beginPath();
          ctx.moveTo(point.px, point.py);
          ctx.lineTo(point.px, point.errorPy);
          ctx.strokeStyle = `${sheet.pickedColor ?? sheet.color}80`;
          ctx.lineWidth = Math.max(1.5, canvas.width / 900);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(point.px, point.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${sheet.pickedColor ?? sheet.color}70`;
        ctx.fill();
        ctx.lineWidth = Math.max(1, canvas.width / 1100);
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.stroke();
      });
    });

    const selectedPointIds = new Set(selectedCells.map((cell) => cell.pointId));
    points.forEach((point, index) => {
      const radius = Math.max(5, canvas.width / 150);
      if (selectedPointIds.has(point.id)) {
        ctx.beginPath();
        ctx.arc(point.px, point.py, radius + Math.max(5, canvas.width / 220), 0, Math.PI * 2);
        ctx.fillStyle = point.id === selectedPointId ? "rgba(233, 101, 75, .18)" : "rgba(15, 118, 110, .16)";
        ctx.fill();
        ctx.lineWidth = Math.max(2, canvas.width / 650);
        ctx.strokeStyle = point.id === selectedPointId ? "#e9654b" : "#0f766e";
        ctx.stroke();
      }
      if (point.errorPy !== null) {
        ctx.beginPath();
        ctx.moveTo(point.px, point.py);
        ctx.lineTo(point.px, point.errorPy);
        ctx.moveTo(point.px - radius, point.errorPy);
        ctx.lineTo(point.px + radius, point.errorPy);
        ctx.strokeStyle = "#e9654b";
        ctx.lineWidth = Math.max(2, canvas.width / 700);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(point.px, point.py, radius, 0, Math.PI * 2);
      ctx.fillStyle = activeSheetColor;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, canvas.width / 900);
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${Math.max(8, canvas.width / 115)}px Arial`;
      ctx.fillText(String(index + 1), point.px, point.py);
    });
  }, [calibrations, brushStrokes, dataSheets, activeSheetId, activeSheetColor, points, selectedPointId, selectedCells]);

  useEffect(() => draw(), [draw]);

  const loadFile = useCallback((file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setFlash(t("invalidImage"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setFileName(file.name);
      setCalibrations([]);
      setPoints([]);
      setDataSheets([{ id: 1, name: "Series 1", points: [], color: seriesColors[0], pickedColor: null }]);
      setActiveSheetId(1);
      setSelectedPointId(null);
      setSelectedCells([]);
      setEditingCell(null);
      setCalibrationIndex(0);
      setMode("calibrate");
      setColorPickMode(false);
      setPickedColor(null);
      setExtractionScope("full");
      setBrushMode(false);
      setBrushStrokes([]);
      brushDrawingRef.current = false;
      setZoom(1);
      historyRef.current = [];
      nextIdRef.current = 1;
      nextSheetIdRef.current = 2;
      setFlash(t("imageLoaded"));
      requestAnimationFrame(draw);
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => { setFlash(t("imageReadFailed")); URL.revokeObjectURL(objectUrl); };
    image.src = objectUrl;
  }, [draw, t]);

  const canvasCoordinates = (event: PointerEvent<HTMLCanvasElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };

  const handleCanvasMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const pixel = canvasCoordinates(event);
    setCursor(pixelToValue(pixel.x, pixel.y));

    if (brushMode && brushDrawingRef.current) {
      setBrushStrokes((current) => {
        const stroke = current[current.length - 1];
        if (!stroke) return current;
        const previous = stroke.points[stroke.points.length - 1];
        if (previous && Math.hypot(pixel.x - previous.x, pixel.y - previous.y) < Math.max(1, stroke.size / 7)) return current;
        return [...current.slice(0, -1), { ...stroke, points: [...stroke.points, pixel] }];
      });
    }

    const source = canvasRef.current;
    const lens = magnifierRef.current;
    if (!magnifierEnabled || !source || !lens) return;

    const lensSize = 168;
    const ctx = lens.getContext("2d");
    if (!ctx) return;
    lens.width = lensSize;
    lens.height = lensSize;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lensSize, lensSize);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(lensSize / 2, lensSize / 2);
    ctx.scale(magnifierPower, magnifierPower);
    ctx.drawImage(source, -pixel.x, -pixel.y);
    ctx.restore();

    const center = lensSize / 2;
    ctx.strokeStyle = "rgba(233, 101, 75, .92)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, lensSize);
    ctx.moveTo(0, center);
    ctx.lineTo(lensSize, center);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e9654b";
    ctx.stroke();
    ctx.fillStyle = "rgba(15, 118, 110, .9)";
    ctx.beginPath();
    ctx.roundRect(lensSize - 42, 8, 30, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${magnifierPower}×`, lensSize - 27, 18);

    lens.style.opacity = "1";
  };

  const hideMagnifier = () => {
    setCursor(null);
    if (magnifierRef.current) magnifierRef.current.style.opacity = "0";
  };

  useEffect(() => {
    if (!magnifierEnabled && magnifierRef.current) magnifierRef.current.style.opacity = "0";
  }, [magnifierEnabled]);

  const findPointAtCanvasPosition = (event: PointerEvent<HTMLCanvasElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !points.length) return null;
    const rect = canvas.getBoundingClientRect();
    const hitRadius = 13;
    let closest: DataPoint | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    points.forEach((point) => {
      const pointX = rect.left + point.px / canvas.width * rect.width;
      const pointY = rect.top + point.py / canvas.height * rect.height;
      const distance = Math.hypot(event.clientX - pointX, event.clientY - pointY);
      if (distance <= hitRadius && distance < closestDistance) {
        closest = point;
        closestDistance = distance;
      }
    });
    return closest;
  };

  const selectPointFromCanvas = (point: DataPoint, beginEditing = false) => {
    const rowIndex = points.findIndex((item) => item.id === point.id);
    const cell = { pointId: point.id, column: "y" as DataColumn };
    setSelectedPointId(point.id);
    setSelectedCells([cell]);
    setFlash(t(beginEditing ? "graphPointSelectedEdit" : "graphPointSelected", { number: rowIndex + 1 }));
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-cell="${cell.pointId}-${cell.column}"]`);
      element?.focus();
      element?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    if (beginEditing) {
      setEditingCell(cell);
      setEditValue(String(point.y));
      cancelEditRef.current = false;
    }
  };

  const handleCanvasDoubleClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (mode !== "extract" || colorPickMode || brushMode) return;
    const point = findPointAtCanvasPosition(event);
    if (!point) return;
    event.preventDefault();
    selectPointFromCanvas(point, true);
  };

  const handleCanvasAction = (event: PointerEvent<HTMLCanvasElement> | ReactMouseEvent<HTMLCanvasElement>, forceErrorBar = false) => {
    event.preventDefault();
    const pixel = canvasCoordinates(event);
    if (colorPickMode) {
      const image = imageRef.current;
      if (!image) return;
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = image.naturalWidth;
      sampleCanvas.height = image.naturalHeight;
      const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return;
      sampleContext.drawImage(image, 0, 0);
      const sampleX = Math.max(0, Math.min(image.naturalWidth - 1, Math.round(pixel.x)));
      const sampleY = Math.max(0, Math.min(image.naturalHeight - 1, Math.round(pixel.y)));
      const sample = sampleContext.getImageData(sampleX, sampleY, 1, 1).data;
      const hex = rgbToHex(sample[0], sample[1], sample[2]);
      setPickedColor(hex);
      setDataSheets((current) => current.map((sheet) => sheet.id === activeSheetId ? { ...sheet, pickedColor: hex } : sheet));
      setColorPickMode(false);
      setFlash(t("colorPicked", { color: hex }));
      return;
    }
    if (mode === "calibrate") {
      snapshot();
      const next = [...calibrations];
      next[calibrationIndex] = pixel;
      setCalibrations(next.slice(0, calibrationIndex + 1));
      if (calibrationIndex < 3) {
        const nextIndex = calibrationIndex + 1;
        setCalibrationIndex(nextIndex);
        setFlash(t("clickCalibration", { label: calibrationLabels[nextIndex] }));
      } else {
        setFlash(t("calibrationComplete"));
      }
      return;
    }
    if (mode !== "extract") return;
    const isErrorBarGesture = forceErrorBar || event.ctrlKey || event.metaKey || errorModifierRef.current.control || errorModifierRef.current.meta;
    if (!isErrorBarGesture && !event.altKey) {
      const existingPoint = findPointAtCanvasPosition(event);
      if (existingPoint) {
        selectPointFromCanvas(existingPoint);
        return;
      }
    }
    const value = pixelToValue(pixel.x, pixel.y);
    if (!value) return;
    if (isErrorBarGesture) {
      if (points.length === 0) { setFlash(t("addPointFirst")); return; }
      snapshot();
      const targetIndex = selectedPointId === null ? points.length - 1 : points.findIndex((point) => point.id === selectedPointId);
      const safeTargetIndex = targetIndex < 0 ? points.length - 1 : targetIndex;
      const targetPoint = points[safeTargetIndex];
      const yError = Math.abs(value.y - targetPoint.y);
      setPoints((current) => current.map((point) => point.id === targetPoint.id ? { ...point, yError, errorPy: pixel.y } : point));
      setSelectedPointId(targetPoint.id);
      setSelectedCells([{ pointId: targetPoint.id, column: "error" }]);
      lastErrorGestureRef.current = { time: performance.now(), clientX: event.clientX, clientY: event.clientY };
      setFlash(t("errorRecorded", { number: safeTargetIndex + 1, value: formatNumber(yError) }));
    } else {
      snapshot();
      const point: DataPoint = { id: nextIdRef.current++, px: pixel.x, py: pixel.y, x: value.x, y: value.y, yError: null, errorPy: null };
      setPoints((current) => [...current, point]);
      setSelectedPointId(point.id);
      setSelectedCells([{ pointId: point.id, column: "y" }]);
      setFlash(t("pointAdded", { number: points.length + 1 }));
    }
  };

  const handleCanvasClick = (event: PointerEvent<HTMLCanvasElement>) => handleCanvasAction(event);

  const handleCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!brushMode || mode !== "extract") {
      handleCanvasClick(event);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    brushDrawingRef.current = true;
    const pixel = canvasCoordinates(event);
    setBrushStrokes((current) => [...current, { points: [pixel], size: brushSize }]);
    setExtractionScope("brush");
    setSelectedPointId(null);
    setSelectedCells([]);
    setEditingCell(null);
    setFlash(t("addingBrush"));
  };

  const finishBrushStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!brushDrawingRef.current) return;
    brushDrawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setFlash(t("brushReady"));
  };

  const handleCanvasContextMenu = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (mode !== "extract" || colorPickMode || brushMode) return;
    const previous = lastErrorGestureRef.current;
    const alreadyHandled = performance.now() - previous.time < 450
      && Math.hypot(event.clientX - previous.clientX, event.clientY - previous.clientY) < 3;
    if (!alreadyHandled) handleCanvasAction(event, true);
  };

  const undo = useCallback(() => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    setCalibrations(previous.calibrations);
    setPoints(previous.points);
    setCalibrationIndex(previous.calibrationIndex);
    setMode(previous.mode);
    setSelectedPointId(previous.selectedPointId);
    setSelectedCells(previous.selectedCells ?? []);
    setEditingCell(null);
    setFlash(t("undone"));
  }, [t]);

  const deleteSelectedPoints = useCallback(() => {
    const selectedIds = [...new Set(selectedCells.map((cell) => cell.pointId))];
    if (!selectedIds.length && selectedPointId !== null) selectedIds.push(selectedPointId);
    if (!selectedIds.length) return false;
    const selectedIndices = selectedIds.map((id) => points.findIndex((point) => point.id === id)).filter((index) => index >= 0);
    if (!selectedIndices.length) return false;
    snapshot();
    const selectedIdSet = new Set(selectedIds);
    const remaining = points.filter((point) => !selectedIdSet.has(point.id));
    const firstSelectedIndex = Math.min(...selectedIndices);
    const nextSelection = remaining[Math.min(firstSelectedIndex, remaining.length - 1)] ?? null;
    const activeColumn = selectedCells[selectedCells.length - 1]?.column ?? "x";
    setPoints(remaining);
    setSelectedPointId(nextSelection?.id ?? null);
    setSelectedCells(nextSelection ? [{ pointId: nextSelection.id, column: activeColumn }] : []);
    setEditingCell(null);
    setFlash(t("pointsDeleted", { count: selectedIndices.length }));
    return true;
  }, [points, selectedCells, selectedPointId, snapshot, t]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
      if ((event.key === "Backspace" || event.key === "Delete") && !isTyping) {
        event.preventDefault();
        if (!deleteSelectedPoints()) undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelectedPoints, undo]);

  const beginExtraction = () => {
    if (!isCalibrationValid) { setFlash(t("needCalibration")); return; }
    if (!scaleValuesValid || !yScaleValuesValid) { setFlash(t("positiveLog")); return; }
    if (calibrations[0].x === calibrations[1].x || calibrations[2].y === calibrations[3].y) { setFlash(t("distinctCalibration")); return; }
    snapshot(); setMode("extract"); setFlash(t("ready"));
  };

  const recalibrate = () => { snapshot(); setColorPickMode(false); setBrushMode(false); setBrushStrokes([]); setExtractionScope("full"); brushDrawingRef.current = false; setCalibrations([]); setPoints([]); setDataSheets((current) => current.map((sheet) => ({ ...sheet, points: [] }))); setSelectedPointId(null); setSelectedCells([]); setEditingCell(null); setCalibrationIndex(0); setMode("calibrate"); setFlash(t("clickCalibration", { label: calibrationLabels[0] })); };
  const removePoint = (id: number) => {
    snapshot();
    setPoints((current) => current.filter((point) => point.id !== id));
    const remainingCells = selectedCells.filter((cell) => cell.pointId !== id);
    setSelectedCells(remainingCells);
    if (selectedPointId === id) setSelectedPointId(remainingCells[remainingCells.length - 1]?.pointId ?? null);
  };

  const runColorExtraction = () => {
    const image = imageRef.current;
    if (!image || !pickedColor || calibrations.length < 4) {
      setFlash(t("chooseColorFirst"));
      return;
    }
    if (extractionScope === "brush" && !brushStrokes.length) {
      setFlash(t("noBrushArea"));
      return;
    }

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) return;
    sourceContext.drawImage(image, 0, 0);
    const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    const target = hexToRgb(pickedColor);
    const toleranceSquared = colorTolerance * colorTolerance;
    const spacing = Math.max(1, Math.round(pointSpacing));
    let brushMask: Uint8ClampedArray | null = null;
    if (extractionScope === "brush") {
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = sourceCanvas.width;
      maskCanvas.height = sourceCanvas.height;
      const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;
      maskContext.lineCap = "round";
      maskContext.lineJoin = "round";
      maskContext.strokeStyle = "#ffffff";
      maskContext.fillStyle = "#ffffff";
      brushStrokes.forEach((stroke) => {
        if (!stroke.points.length) return;
        maskContext.lineWidth = stroke.size;
        if (stroke.points.length === 1) {
          maskContext.beginPath();
          maskContext.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
          maskContext.fill();
          return;
        }
        maskContext.beginPath();
        maskContext.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.slice(1).forEach((point) => maskContext.lineTo(point.x, point.y));
        maskContext.stroke();
      });
      brushMask = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    }
    const left = 0;
    const right = sourceCanvas.width - 1;
    const top = 0;
    const bottom = sourceCanvas.height - 1;
    const regionWidth = right - left + 1;
    const regionHeight = bottom - top + 1;
    const colorMask = new Uint8Array(regionWidth * regionHeight);
    const bins = new Map<number, { sumX: number; sumY: number; count: number }>();

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const offset = (y * sourceCanvas.width + x) * 4;
        if (imageData[offset + 3] < 128) continue;
        if (brushMask && brushMask[offset + 3] < 128) continue;
        const redDelta = imageData[offset] - target.red;
        const greenDelta = imageData[offset + 1] - target.green;
        const blueDelta = imageData[offset + 2] - target.blue;
        if (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta > toleranceSquared) continue;
        colorMask[(y - top) * regionWidth + (x - left)] = 1;
        const binIndex = Math.floor((x - left) / spacing);
        const bin = bins.get(binIndex) ?? { sumX: 0, sumY: 0, count: 0 };
        bin.sumX += x;
        bin.sumY += y;
        bin.count += 1;
        bins.set(binIndex, bin);
      }
    }

    const candidates: PixelCandidate[] = [];
    if (spacingMode === "fixed") {
      const minimumSamples = Math.max(1, Math.ceil(spacing / 8));
      [...bins.entries()].sort(([a], [b]) => a - b).forEach(([, bin]) => {
        if (bin.count < minimumSamples) return;
        candidates.push({ x: bin.sumX / bin.count, y: bin.sumY / bin.count, weight: bin.count });
      });
    } else {
      const queue = new Int32Array(colorMask.length);
      const markerSizeLimit = Math.max(8, spacing * .9);
      const minimumComponentPixels = 2;
      for (let start = 0; start < colorMask.length; start += 1) {
        if (colorMask[start] !== 1) continue;
        let head = 0;
        let tail = 0;
        queue[tail++] = start;
        colorMask[start] = 2;
        let count = 0;
        let sumX = 0;
        let sumY = 0;
        let minimumX = Number.POSITIVE_INFINITY;
        let maximumX = Number.NEGATIVE_INFINITY;
        let minimumY = Number.POSITIVE_INFINITY;
        let maximumY = Number.NEGATIVE_INFINITY;
        const columnStats = new Map<number, { sumY: number; count: number }>();

        while (head < tail) {
          const index = queue[head++];
          const localX = index % regionWidth;
          const localY = Math.floor(index / regionWidth);
          const x = localX + left;
          const y = localY + top;
          count += 1;
          sumX += x;
          sumY += y;
          minimumX = Math.min(minimumX, x);
          maximumX = Math.max(maximumX, x);
          minimumY = Math.min(minimumY, y);
          maximumY = Math.max(maximumY, y);
          const column = columnStats.get(x) ?? { sumY: 0, count: 0 };
          column.sumY += y;
          column.count += 1;
          columnStats.set(x, column);

          for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
            for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
              if (xOffset === 0 && yOffset === 0) continue;
              const neighborX = localX + xOffset;
              const neighborY = localY + yOffset;
              if (neighborX < 0 || neighborX >= regionWidth || neighborY < 0 || neighborY >= regionHeight) continue;
              const neighborIndex = neighborY * regionWidth + neighborX;
              if (colorMask[neighborIndex] !== 1) continue;
              colorMask[neighborIndex] = 2;
              queue[tail++] = neighborIndex;
            }
          }
        }

        if (count < minimumComponentPixels) continue;
        const componentWidth = maximumX - minimumX + 1;
        const componentHeight = maximumY - minimumY + 1;
        if (componentWidth <= markerSizeLimit && componentHeight <= markerSizeLimit) {
          candidates.push({ x: sumX / count, y: sumY / count, weight: count });
        } else {
          const centerline = [...columnStats.entries()].sort(([a], [b]) => a - b).map(([x, column]) => ({ x, y: column.sumY / column.count, weight: column.count }));
          candidates.push(...adaptiveCandidates(centerline, spacing));
        }
      }
    }

    const extracted: DataPoint[] = [];
    candidates.sort((a, b) => a.x - b.x).forEach((candidate) => {
      const value = pixelToValue(candidate.x, candidate.y);
      if (!value) return;
      extracted.push({ id: nextIdRef.current++, px: candidate.x, py: candidate.y, x: value.x, y: value.y, yError: null, errorPy: null });
    });

    if (!extracted.length) {
      setFlash(t("noColorPixels"));
      return;
    }
    extracted.sort((a, b) => a.x - b.x);
    snapshot();
    setPoints(extracted);
    setSelectedPointId(null);
    setSelectedCells([]);
    setEditingCell(null);
    setFlash(t(spacingMode === "adaptive" ? "extractedAdaptive" : "extractedFixed", { scope: t(extractionScope === "brush" ? "brushArea" : "fullImage"), color: pickedColor, count: extracted.length }));
  };

  const exportData = async () => {
    if (!points.length) { setFlash(t("noExportData")); return; }
    const formats: Record<ExportDelimiter, { character: string; extension: string; label: string; mime: string }> = {
      space: { character: " ", extension: "dat", label: t("space"), mime: "text/plain;charset=utf-8" },
      comma: { character: ",", extension: "csv", label: t("commaLabel"), mime: "text/csv;charset=utf-8" },
      tab: { character: "\t", extension: "tsv", label: t("tabLabel"), mime: "text/tab-separated-values;charset=utf-8" },
      semicolon: { character: ";", extension: "csv", label: t("semicolonLabel"), mime: "text/csv;charset=utf-8" },
    };
    const format = formats[exportDelimiter];
    const header = exportDelimiter === "space" ? "# x y y_error" : ["x", "y", "y_error"].join(format.character);
    const rows = [header, ...points.map((point) => [point.x, point.y, point.yError ?? ""].join(format.character).trimEnd())];
    const contents = rows.join("\n") + "\n";
    const sheetFileName = (activeSheet?.name ?? "series").replace(/[^\p{L}\p{N}_-]+/gu, "-");
    const exportFileName = `${fileName.replace(/\.[^.]+$/, "") || "plot"}-${sheetFileName}.${format.extension}`;
    const isDesktopApp = typeof window !== "undefined" && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

    if (isDesktopApp) {
      try {
        const [{ save }, { writeTextFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const path = await save({
          title: t("saveData", { sheet: activeSheet?.name ?? t("currentSheet") }),
          defaultPath: exportFileName,
          filters: [{ name: format.label, extensions: [format.extension] }],
        });
        if (!path) { setFlash(t("saveCancelled")); return; }
        await writeTextFile(path, contents);
        setFlash(t("saved", { sheet: activeSheet?.name ?? t("currentSheet"), delimiter: format.label }));
        return;
      } catch {
        setFlash(t("saveFailed"));
        return;
      }
    }

    const blob = new Blob([contents], { type: format.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = exportFileName; link.click();
    URL.revokeObjectURL(url); setFlash(t("saved", { sheet: activeSheet?.name ?? t("currentSheet"), delimiter: format.label }));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files[0]); };
  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => { loadFile(event.target.files?.[0]); event.target.value = ""; };

  const switchDataSheet = (sheetId: number) => {
    if (sheetId === activeSheetId) return;
    const targetSheet = dataSheets.find((sheet) => sheet.id === sheetId);
    if (!targetSheet) return;
    setDataSheets((current) => current.map((sheet) => sheet.id === activeSheetId ? { ...sheet, points: points.map((point) => ({ ...point })), pickedColor } : sheet));
    setActiveSheetId(sheetId);
    setPoints(targetSheet.points.map((point) => ({ ...point })));
    setPickedColor(targetSheet.pickedColor);
    setSelectedPointId(null);
    setSelectedCells([]);
    setEditingCell(null);
    setColorPickMode(false);
    setBrushMode(false);
    setBrushStrokes([]);
    setExtractionScope("full");
    brushDrawingRef.current = false;
    historyRef.current = [];
    setFlash(t("sheetSwitched", { sheet: targetSheet.name }));
  };

  const addDataSheet = () => {
    const id = nextSheetIdRef.current++;
    const name = `Series ${dataSheets.length + 1}`;
    const newSheet: DataSheet = { id, name, points: [], color: seriesColors[(id - 1) % seriesColors.length], pickedColor: null };
    setDataSheets((current) => [...current.map((sheet) => sheet.id === activeSheetId ? { ...sheet, points: points.map((point) => ({ ...point })), pickedColor } : sheet), newSheet]);
    setActiveSheetId(id);
    setPoints([]);
    setPickedColor(null);
    setSelectedPointId(null);
    setSelectedCells([]);
    setEditingCell(null);
    setColorPickMode(false);
    setBrushMode(false);
    setBrushStrokes([]);
    setExtractionScope("full");
    brushDrawingRef.current = false;
    historyRef.current = [];
    setFlash(t("sheetAdded", { sheet: name }));
  };

  const activeValue = calibrationIndex === 0 ? xMin : calibrationIndex === 1 ? xMax : calibrationIndex === 2 ? yMin : yMax;
  const totalPointCount = points.length + dataSheets.filter((sheet) => sheet.id !== activeSheetId).reduce((sum, sheet) => sum + sheet.points.length, 0);
  const selectedPointIndex = points.findIndex((point) => point.id === selectedPointId);
  const selectedPoint = selectedPointIndex >= 0 ? points[selectedPointIndex] : null;
  const activeCell = selectedCells[selectedCells.length - 1] ?? null;
  const selectedRowCount = new Set(selectedCells.map((cell) => cell.pointId)).size;

  const selectDataCell = (cell: SelectedCell, event?: ReactMouseEvent<HTMLTableCellElement>) => {
    if (event?.shiftKey && activeCell) {
      const startRow = points.findIndex((point) => point.id === activeCell.pointId);
      const endRow = points.findIndex((point) => point.id === cell.pointId);
      const startColumn = dataColumns.indexOf(activeCell.column);
      const endColumn = dataColumns.indexOf(cell.column);
      const range: SelectedCell[] = [];
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row += 1) {
        for (let column = Math.min(startColumn, endColumn); column <= Math.max(startColumn, endColumn); column += 1) {
          range.push({ pointId: points[row].id, column: dataColumns[column] });
        }
      }
      const withoutTarget = range.filter((item) => !(item.pointId === cell.pointId && item.column === cell.column));
      setSelectedCells([...withoutTarget, cell]);
      setSelectedPointId(cell.pointId);
      setFlash(t("rangeSelected", { cells: range.length, rows: new Set(range.map((item) => item.pointId)).size }));
      return;
    }

    if (event && (event.ctrlKey || event.metaKey)) {
      const exists = selectedCells.some((item) => item.pointId === cell.pointId && item.column === cell.column);
      const next = exists
        ? selectedCells.filter((item) => !(item.pointId === cell.pointId && item.column === cell.column))
        : [...selectedCells, cell];
      setSelectedCells(next);
      setSelectedPointId(next[next.length - 1]?.pointId ?? null);
      setFlash(t("cellsChosen", { count: next.length }));
      return;
    }

    setSelectedCells([cell]);
    setSelectedPointId(cell.pointId);
    const rowIndex = points.findIndex((point) => point.id === cell.pointId);
    setFlash(t("cellChosen", { number: rowIndex + 1, column: cell.column === "index" ? t("numberColumn") : cell.column === "error" ? t("errorColumn") : cell.column.toUpperCase() }));
  };

  const focusDataCell = (cell: SelectedCell) => {
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-cell="${cell.pointId}-${cell.column}"]`);
      element?.focus();
      element?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };

  const startCellEdit = (cell: SelectedCell) => {
    if (cell.column === "index") return;
    const point = points.find((item) => item.id === cell.pointId);
    if (!point) return;
    const value = cell.column === "x" ? point.x : cell.column === "y" ? point.y : point.yError;
    setEditingCell(cell);
    setEditValue(value === null ? "" : String(value));
    cancelEditRef.current = false;
  };

  const commitCellEdit = (cell: SelectedCell, rawValue: string) => {
    const point = points.find((item) => item.id === cell.pointId);
    if (!point || cell.column === "index") { setEditingCell(null); return; }
    const isEmptyError = cell.column === "error" && rawValue.trim() === "";
    const numericValue = isEmptyError ? null : Number(rawValue);
    if (numericValue !== null && !Number.isFinite(numericValue)) {
      setFlash(t("enterNumber"));
      setEditingCell(null);
      return;
    }
    if ((cell.column === "x" && xScale === "log" || cell.column === "y" && yScale === "log") && (numericValue === null || numericValue <= 0)) {
      setFlash(t("positiveLogSingle"));
      setEditingCell(null);
      return;
    }
    if (cell.column === "error" && numericValue !== null && numericValue < 0) {
      setFlash(t("nonNegativeError"));
      setEditingCell(null);
      return;
    }

    const oldErrorValue = point.errorPy === null ? null : pixelToValue(point.px, point.errorPy)?.y ?? null;
    let errorDirection = oldErrorValue !== null && oldErrorValue < point.y ? -1 : 1;
    snapshot();
    setPoints((current) => current.map((item) => {
      if (item.id !== point.id) return item;
      if (cell.column === "x" && numericValue !== null) {
        const px = inverseInterpolate(numericValue, calibrations[0].x, calibrations[1].x, xMin, xMax, xScale);
        return { ...item, x: numericValue, px };
      }
      if (cell.column === "y" && numericValue !== null) {
        const py = inverseInterpolate(numericValue, calibrations[2].y, calibrations[3].y, yMin, yMax, yScale);
        let errorPy = item.errorPy;
        if (item.yError !== null) {
          let endpoint = numericValue + errorDirection * item.yError;
          if (yScale === "log" && endpoint <= 0) { errorDirection = 1; endpoint = numericValue + item.yError; }
          errorPy = inverseInterpolate(endpoint, calibrations[2].y, calibrations[3].y, yMin, yMax, yScale);
        }
        return { ...item, y: numericValue, py, errorPy };
      }
      if (cell.column === "error") {
        if (numericValue === null) return { ...item, yError: null, errorPy: null };
        let endpoint = item.y + errorDirection * numericValue;
        if (yScale === "log" && endpoint <= 0) { errorDirection = 1; endpoint = item.y + numericValue; }
        const errorPy = inverseInterpolate(endpoint, calibrations[2].y, calibrations[3].y, yMin, yMax, yScale);
        return { ...item, yError: numericValue, errorPy };
      }
      return item;
    }));
    setEditingCell(null);
    setFlash(t("valueEdited", { column: cell.column === "error" ? t("errorColumn") : cell.column.toUpperCase() }));
  };

  const handleDataCellKeyDown = (event: ReactKeyboardEvent<HTMLTableCellElement>, cell: SelectedCell) => {
    if ((event.key === "Enter" || event.key === "F2") && cell.column !== "index") {
      event.preventDefault();
      startCellEdit(cell);
      return;
    }
    const currentRow = points.findIndex((point) => point.id === cell.pointId);
    const currentColumn = dataColumns.indexOf(cell.column);
    let nextRow = currentRow;
    let nextColumn = currentColumn;
    if (event.key === "ArrowUp") nextRow -= 1;
    else if (event.key === "ArrowDown") nextRow += 1;
    else if (event.key === "ArrowLeft") nextColumn -= 1;
    else if (event.key === "ArrowRight") nextColumn += 1;
    else if (event.key === "Tab") {
      nextColumn += event.shiftKey ? -1 : 1;
      if (nextColumn >= dataColumns.length) { nextColumn = 0; nextRow += 1; }
      if (nextColumn < 0) { nextColumn = dataColumns.length - 1; nextRow -= 1; }
    } else return;
    event.preventDefault();
    nextRow = Math.max(0, Math.min(points.length - 1, nextRow));
    nextColumn = Math.max(0, Math.min(dataColumns.length - 1, nextColumn));
    const nextCell = { pointId: points[nextRow].id, column: dataColumns[nextColumn] };
    setSelectedCells([nextCell]);
    setSelectedPointId(nextCell.pointId);
    focusDataCell(nextCell);
  };

  const renderDataCell = (point: DataPoint, rowIndex: number, column: DataColumn, content: ReactNode, extraClass = "") => {
    const cell = { pointId: point.id, column };
    const isSelected = selectedCells.some((item) => item.pointId === point.id && item.column === column);
    const isActive = activeCell?.pointId === point.id && activeCell.column === column;
    const isEditing = editingCell?.pointId === point.id && editingCell.column === column;
    return <td key={column} data-cell={`${point.id}-${column}`} className={`data-cell ${extraClass} ${isSelected ? "selected-cell" : ""} ${isActive ? "active-cell" : ""}`} tabIndex={isActive || (!activeCell && rowIndex === 0 && column === "index") ? 0 : -1} onClick={(event) => selectDataCell(cell, event)} onDoubleClick={() => startCellEdit(cell)} onKeyDown={(event) => handleDataCellKeyDown(event, cell)}>{isEditing ? <input ref={editorInputRef} className="cell-editor" value={editValue} onChange={(event) => setEditValue(event.target.value)} onBlur={() => { if (cancelEditRef.current) { cancelEditRef.current = false; setEditingCell(null); } else commitCellEdit(cell, editValue); }} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { cancelEditRef.current = true; event.currentTarget.blur(); } }} /> : content}</td>;
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">S</div><div><h1>PlotSift</h1><p>{t("tagline")}</p></div>
        <div className="top-actions">
          <label className="language-select"><span>{t("language")}</span><select value={languagePreference} onChange={(event) => changeLanguage(event.target.value as LanguagePreference)} aria-label={t("language")}><option value="auto">{t("languageAuto")}</option><option value="ko">{t("languageKorean")}</option><option value="en">{t("languageEnglish")}</option></select></label>
          <span className="privacy-badge"><span className="status-dot" />{t("localOnly")}</span><button className="icon-button" title={t("privacyTitle")}>?</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className={`step ${mode !== "empty" ? "done" : "active"}`}><span>1</span><div><b>{t("image")}</b><small>{fileName || t("loadFile")}</small></div></div>
          <div className={`step ${mode === "calibrate" ? "active" : mode === "extract" ? "done" : ""}`}><span>2</span><div><b>{t("calibration")}</b><small>{t("calibrationDesc")}</small></div></div>
          <div className={`step ${mode === "extract" ? "active" : ""}`}><span>3</span><div><b>{t("extraction")}</b><small>{t("extractionDesc")}</small></div></div>

          <div className="axis-card">
            <div className="card-title"><span>{t("xAxis")}</span><select disabled={mode === "extract"} value={xScale} onChange={(e) => setXScale(e.target.value as ScaleType)}><option value="linear">{t("linear")}</option><option value="log">{t("log")}</option></select></div>
            <div className="field-row"><label>{t("minimum")}<input disabled={mode === "extract"} type="number" value={xMin} onChange={(e) => setXMin(Number(e.target.value))} /></label><label>{t("maximum")}<input disabled={mode === "extract"} type="number" value={xMax} onChange={(e) => setXMax(Number(e.target.value))} /></label></div>
            <div className="cal-progress"><span className={calibrations[0] ? "picked" : calibrationIndex === 0 ? "current" : ""}>1</span><i /><span className={calibrations[1] ? "picked" : calibrationIndex === 1 ? "current" : ""}>2</span><small>{t("twoAxisPositions")}</small></div>
          </div>
          <div className="axis-card">
            <div className="card-title"><span>{t("yAxis")}</span><select disabled={mode === "extract"} value={yScale} onChange={(e) => setYScale(e.target.value as ScaleType)}><option value="linear">{t("linear")}</option><option value="log">{t("log")}</option></select></div>
            <div className="field-row"><label>{t("minimum")}<input disabled={mode === "extract"} type="number" value={yMin} onChange={(e) => setYMin(Number(e.target.value))} /></label><label>{t("maximum")}<input disabled={mode === "extract"} type="number" value={yMax} onChange={(e) => setYMax(Number(e.target.value))} /></label></div>
            <div className="cal-progress coral"><span className={calibrations[2] ? "picked" : calibrationIndex === 2 ? "current" : ""}>3</span><i /><span className={calibrations[3] ? "picked" : calibrationIndex === 3 ? "current" : ""}>4</span><small>{t("twoAxisPositions")}</small></div>
          </div>
          {mode === "calibrate" && <div className="calibration-callout"><b>{calibrationLabels[calibrationIndex]}</b><span>{t("clickValuePosition", { value: activeValue })}</span></div>}
          {mode === "extract" ? <>
            <div className="color-extract-card">
              <div className="color-card-title"><span>{t("colorExtraction")}</span><em>{`${t(extractionScope === "brush" ? "brush" : "fullImage")} · ${t(spacingMode === "adaptive" ? "autoDensity" : "fixed")}`}</em></div>
              <div className="color-picker-row">
                <label className="color-swatch" style={{ background: pickedColor ?? "conic-gradient(#e9654b, #e9b44c, #4fbd85, #1683a5, #8b6dc1, #e9654b)" }}><input type="color" value={pickedColor ?? activeSheetColor} onChange={(event) => { const color = event.target.value; setPickedColor(color); setDataSheets((current) => current.map((sheet) => sheet.id === activeSheetId ? { ...sheet, pickedColor: color } : sheet)); }} aria-label={t("extractionColor")} /></label>
                <div><b>{pickedColor ?? t("colorNotSelected")}</b><small>{t("graphColor")}</small></div>
                <button className={colorPickMode ? "picking" : ""} onClick={() => { const next = !colorPickMode; setColorPickMode(next); if (next) { setBrushMode(false); brushDrawingRef.current = false; } setFlash(t(next ? "pickColorPrompt" : "colorPickCancelled")); }}>{t(colorPickMode ? "cancelSelection" : "pickFromImage")}</button>
              </div>
              <div className="extraction-scope" role="group" aria-label={t("colorSearchRange")}><button className={extractionScope === "full" ? "active" : ""} onClick={() => { setExtractionScope("full"); setBrushMode(false); brushDrawingRef.current = false; setFlash(t("scopeFull")); }}>{t("fullImage")}</button><button className={extractionScope === "brush" ? "active" : ""} onClick={() => { setExtractionScope("brush"); setBrushMode(true); setColorPickMode(false); setFlash(t("brushEnabled")); }}>{t("brushArea")}</button></div>
              {extractionScope === "brush" && <div className="brush-panel">
                <div className="brush-actions"><button className={brushMode ? "active" : ""} onClick={() => { const next = !brushMode; setBrushMode(next); setColorPickMode(false); brushDrawingRef.current = false; setFlash(t(next ? "brushDrag" : "brushLocked")); }}>{t(brushMode ? "brushDrawing" : "drawBrush")}</button><button disabled={!brushStrokes.length} onClick={() => { setBrushStrokes([]); brushDrawingRef.current = false; setFlash(t("brushCleared")); }}>{t("clearArea")}</button></div>
                <label className="range-control"><span>{t("brushWidth")} <b>{brushSize}px</b></span><input type="range" min="8" max="120" step="4" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /></label>
                <small>{brushStrokes.length ? t("brushCount", { count: brushStrokes.length }) : t("brushHint")}</small>
              </div>}
              <label className="range-control"><span>{t("colorTolerance")} <b>{colorTolerance}</b></span><input type="range" min="0" max="120" step="2" value={colorTolerance} onChange={(event) => setColorTolerance(Number(event.target.value))} /></label>
              <div className="sampling-mode" role="group" aria-label={t("spacingMethod")}><button className={spacingMode === "adaptive" ? "active" : ""} onClick={() => setSpacingMode("adaptive")}>{t("adaptiveDensity")}</button><button className={spacingMode === "fixed" ? "active" : ""} onClick={() => setSpacingMode("fixed")}>{t("fixedSpacing")}</button></div>
              <label className="range-control"><span>{t(spacingMode === "adaptive" ? "curveSpacing" : "pointMinSpacing")} <b>{pointSpacing}px</b></span><input type="range" min="4" max="120" step="2" value={pointSpacing} onChange={(event) => setPointSpacing(Number(event.target.value))} /></label>
              <p>{t(extractionScope === "brush" ? "brushDescription" : spacingMode === "adaptive" ? "adaptiveDescription" : "fixedDescription")}</p>
              <button className="auto-extract-button" disabled={!pickedColor || (extractionScope === "brush" && !brushStrokes.length)} onClick={runColorExtraction}>{t(extractionScope === "brush" ? "extractBrush" : "extractColorPoints")}</button>
            </div>
            <button className="secondary-button" onClick={recalibrate}>{t("recalibrate")}</button>
          </> : <button className="primary-button" disabled={!isCalibrationValid} onClick={beginExtraction}>{t("finishCalibration")}</button>}
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <span className={`mode-pill ${mode}`}>{mode === "empty" ? t("waitingImage") : mode === "calibrate" ? t("calibrating", { current: Math.min(calibrationIndex + 1, 4) }) : t("extractingPoints")}</span>
            <button className="tool" onClick={() => setZoom((value) => Math.max(.5, value - .25))} aria-label={t("zoomOut")}>−</button><span className="zoom-label">{Math.round(zoom * 100)}%</span><button className="tool" onClick={() => setZoom((value) => Math.min(3, value + .25))} aria-label={t("zoomIn")}>＋</button><button className="fit-button" onClick={() => setZoom(1)}>{t("fit")}</button>
            <span className="toolbar-divider" />
            <div className="magnifier-controls">
              <button className={`magnifier-toggle ${magnifierEnabled ? "active" : ""}`} onClick={() => setMagnifierEnabled((enabled) => !enabled)} aria-pressed={magnifierEnabled}>{t("magnifier")}</button>
              <select className="magnifier-power" value={magnifierPower} onChange={(event) => setMagnifierPower(Number(event.target.value))} aria-label={t("magnifierPower")}><option value={2}>2×</option><option value={3}>3×</option><option value={4}>4×</option><option value={6}>6×</option></select>
              <select className="magnifier-side" value={magnifierSide} onChange={(event) => setMagnifierSide(event.target.value as "left" | "right")} aria-label={t("magnifierPosition")}><option value="right">{t("fixedRight")}</option><option value="left">{t("fixedLeft")}</option></select>
            </div>
            {cursor && <span className="cursor-readout">X {formatNumber(cursor.x)} · Y {formatNumber(cursor.y)}</span>}
            <button className="replace-button" onClick={() => fileInputRef.current?.click()}>{t(fileName ? "replaceImage" : "openImage")}</button>
          </div>
          <div className={`plot-stage ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
            {mode === "empty" ? (
              <button className="drop-zone" onClick={() => fileInputRef.current?.click()}><span className="upload-icon">↑</span><b>{t("dropImage")}</b><small>{t("chooseImage")}</small><em>{t("staysLocal")}</em></button>
            ) : (
              <div ref={canvasWrapRef} className="canvas-wrap" style={{ width: `${zoom * 100}%` }}>
                <canvas ref={canvasRef} onPointerDown={handleCanvasPointerDown} onPointerUp={finishBrushStroke} onPointerCancel={finishBrushStroke} onDoubleClick={handleCanvasDoubleClick} onContextMenu={handleCanvasContextMenu} onPointerMove={handleCanvasMove} onPointerLeave={(event) => { hideMagnifier(); if (!event.currentTarget.hasPointerCapture(event.pointerId)) brushDrawingRef.current = false; }} className={`plot-canvas ${brushMode ? "brush-cursor" : colorPickMode ? "eyedropper-cursor" : mode === "calibrate" ? "crosshair" : "data-cursor"}`} />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileInput} />
          </div>
          {mode !== "empty" && <canvas ref={magnifierRef} className={`magnifier-lens ${magnifierSide}`} width={168} height={168} aria-hidden="true" />}
          <div className="flash-bar"><span>{flash || t("initialHint")}</span><div><span><kbd>{t("click")}</kbd> {t("addSelectPoint")}</span><span><kbd>{t("doubleClick")}</kbd> {t("editSelectedPoint")}</span><span className="accent-hint"><kbd>Ctrl/⌘</kbd>+<kbd>{t("click")}</kbd> {t("yError")}</span><span className={selectedCells.length ? "delete-hint" : ""}><kbd>⌫</kbd> {t(selectedCells.length ? "deleteSelected" : "undo")}</span></div></div>
        </section>

        <aside className="data-panel">
          <div className="data-heading"><div><span>{t("extractedData")}</span><small>{points.length} / {t("total")} {totalPointCount}</small></div><button onClick={() => { snapshot(); setPoints([]); setSelectedPointId(null); setSelectedCells([]); setEditingCell(null); }}>{t("clearSheet")}</button></div>
          <div className="sheet-tabs" role="tablist" aria-label={t("sheets")}>
            {dataSheets.map((sheet) => <button key={sheet.id} type="button" role="tab" aria-selected={sheet.id === activeSheetId} className={sheet.id === activeSheetId ? "active" : ""} onClick={() => switchDataSheet(sheet.id)}><i style={{ background: sheet.id === activeSheetId ? activeSheetColor : sheet.pickedColor ?? sheet.color }} /><span>{sheet.name}</span><small>{sheet.id === activeSheetId ? points.length : sheet.points.length}</small></button>)}
            <button type="button" className="add-sheet" onClick={addDataSheet} aria-label={t("addSheet")}>{t("addSheet")}</button>
          </div>
          <div className="series-card"><i style={{ background: activeSheetColor }} /><div><b>{activeSheet?.name ?? "Series"}</b><small>{pickedColor ? `${pickedColor} · ${t("manualAndColor")}` : t("manualNoColor")}</small></div></div>
          <div className="table-scroll" role="region" aria-label={t("spreadsheet")}><table role="grid" aria-multiselectable="true"><thead><tr><th>#</th><th>X</th><th>Y</th><th>± Y err</th><th /></tr></thead><tbody>
            {points.length === 0 ? <tr><td colSpan={5} className="no-data">{t("noPoints")}<br />{t("clickGraphPoint")}</td></tr> : points.map((point, index) => <tr key={point.id} className={selectedCells.some((cell) => cell.pointId === point.id) ? "selected-row" : ""} aria-selected={selectedCells.some((cell) => cell.pointId === point.id)}>{renderDataCell(point, index, "index", index + 1)}{renderDataCell(point, index, "x", formatNumber(point.x))}{renderDataCell(point, index, "y", formatNumber(point.y))}{renderDataCell(point, index, "error", point.yError !== null ? `± ${formatNumber(point.yError)}` : "—", point.yError !== null ? "error-value" : "empty")}<td className="action-cell"><button className="delete-point" onClick={(event) => { event.stopPropagation(); removePoint(point.id); }} aria-label={t("deletePoint", { number: index + 1 })}>×</button></td></tr>)}
          </tbody></table></div>
          <div className={`error-tip ${selectedPoint ? "has-selection" : ""}`}><b>{selectedCells.length > 1 ? t("cellsSelected", { cells: selectedCells.length, rows: selectedRowCount }) : selectedPoint ? t("selectedPoint", { number: selectedPointIndex + 1, value: formatNumber(selectedPoint.y) }) : t("selectByCell")}</b><p>{t(selectedCells.length > 1 ? "multiDeleteHelp" : selectedPoint ? "selectedHelp" : "cellSelectHelp")}</p></div>
          <div className="export-settings"><label>{t("delimiter")}<select value={exportDelimiter} onChange={(event) => setExportDelimiter(event.target.value as ExportDelimiter)}><option value="space">{t("spaceGnuplot")}</option><option value="comma">{t("comma")}</option><option value="tab">{t("tab")}</option><option value="semicolon">{t("semicolon")}</option></select></label><code>{exportDelimiter === "space" ? "x y y_error" : exportDelimiter === "tab" ? "x⇥y⇥y_error" : exportDelimiter === "semicolon" ? "x;y;y_error" : "x,y,y_error"}</code></div>
          <div className="data-actions"><button onClick={undo}>↶ {t("undo")}</button><button className="export-button" onClick={exportData}>{t(exportDelimiter === "space" ? "exportDat" : exportDelimiter === "tab" ? "exportTsv" : "exportCsv")}</button></div>
        </aside>
      </section>
    </main>
  );
}
