# Plotdrop

[English](README.md) | **한국어**

Plotdrop은 연구 논문의 그래프 이미지에서 데이터점과 Y 에러바를 추출하는 로컬 우선(local-first) digitizer입니다. 수동 클릭, 색상 자동 추출, 브러시 제한 추출, 여러 데이터 시트, 스프레드시트형 편집을 한 프로그램에 모았습니다.

> Research preview: 추출 결과는 원본 데이터가 아니라 이미지에서 복원한 근삿값입니다. 분석에 쓰기 전 축 보정과 결과를 반드시 검증하세요.

## 바로 사용하기

[Plotdrop 웹앱 열기](https://kiseokchoi.github.io/plotdrop/) — 설치 없이 브라우저에서 실행되며 이미지와 추출 데이터는 사용자의 기기 안에서만 처리됩니다.

## 두 가지 배포판

- **웹앱/PWA**: 다른 연구자가 주소만 열어 바로 시험하는 기본 배포판입니다. 브라우저에서 설치하면 Dock이나 앱 목록에서 독립 창으로 실행할 수 있고, 첫 실행 후에는 오프라인에서도 동작합니다.
- **Standalone**: DMG로 설치하는 데스크톱 배포판입니다. 오프라인 사용과 운영체제의 네이티브 저장 창을 선호하는 사용자를 위한 버전입니다.

두 배포판은 같은 화면과 데이터 추출 코드를 사용합니다. 그래프 이미지와 추출 데이터는 어느 배포판에서도 외부 서버로 업로드하지 않습니다.

화면 언어는 운영체제·브라우저 언어가 한국어이면 한국어로, 그 외에는 영어로 자동 표시됩니다. 상단의 언어 메뉴에서 **자동 / 한국어 / English**를 직접 선택할 수 있으며 선택값은 다음 실행에도 유지됩니다.

## Standalone 앱 실행

macOS용 앱을 직접 빌드하려면 Node.js 22 이상, Rust stable, Xcode Command Line Tools가 필요합니다.

```sh
npm ci
npm run standalone:dmg
```

앱만 빠르게 빌드하려면 `npm run standalone:build`를 사용합니다. 완료된 앱과 설치 이미지는 다음 폴더에 생깁니다.

```text
src-tauri/target/release/bundle/macos/Plotdrop.app
src-tauri/target/release/bundle/dmg/Plotdrop_0.1.0_aarch64.dmg
```

개발 중 standalone 창을 실행하려면 다음 명령을 사용합니다.

```sh
npm run standalone:dev
```

Rust 명령을 찾지 못한다면 터미널을 다시 열거나, 현재 셸에서 다음을 먼저 실행하세요.

```sh
source "$HOME/.cargo/env"
```

Apple Developer 인증서로 서명·공증하지 않은 공개 테스트 빌드는 macOS에서 처음 열 때 경고가 나타날 수 있습니다. Finder에서 앱을 오른쪽 클릭하고 **열기**를 선택하면 됩니다. 정식 공개 배포에는 Apple Developer 서명과 notarization을 권장합니다.

## 브라우저에서 로컬 실행

```sh
npm ci
npm run dev
```

그런 다음 `http://localhost:3000`을 엽니다. macOS에서는 기존 `Plotdrop.command`를 더블클릭해 로컬 브라우저 버전을 시작할 수도 있습니다.

설치 가능한 PWA 결과물을 로컬에서 만들고 확인하려면 다음을 실행합니다.

```sh
npm run web:build
npm run web:preview
```

PWA 결과물은 `web-dist` 폴더에 생성됩니다.

## 사용 순서

1. 그래프 이미지를 드래그해서 놓거나 **이미지 열기**를 누릅니다.
2. X축 최솟값, X축 최댓값, Y축 최솟값, Y축 최댓값 위치를 차례로 클릭합니다.
3. 축 값과 선형/로그 스케일을 확인하고 **점 추출 시작**을 누릅니다.
4. 데이터점을 일반 클릭으로 기록합니다. 기존 점을 클릭하면 해당 데이터 셀이 선택되고, 더블클릭하면 Y값을 편집합니다. 기존 점 근처에 새 점을 강제로 추가하려면 `Alt+클릭`합니다.
5. `Ctrl` 또는 `⌘`을 누른 채 에러바 끝을 클릭하면 선택한 점과의 Y 차이가 `y_error`로 기록됩니다. 데이터 표의 행을 먼저 선택하면 해당 행의 에러바를 나중에 추가하거나 교체할 수 있습니다.
6. 표에서 `Shift+클릭`은 범위 선택, `Ctrl/⌘+클릭`은 개별 셀 추가 선택입니다. `Backspace` 또는 `Delete`로 선택한 데이터 행을 삭제하고, `Enter`나 더블클릭으로 X, Y, 에러값을 편집합니다.
7. 색상 자동 추출은 **그림에서 선택**으로 색을 고릅니다. **전체 그림** 또는 **브러시 영역**을 검색할 수 있고, 자동 밀도 모드는 조밀한 구간과 성긴 구간의 간격을 다르게 처리합니다.
8. 같은 그림의 다른 계열은 **＋ 시트**로 나눕니다. 시트별 점, 에러바, 추출 색상은 독립적으로 저장됩니다.
9. 내보내기 구분자는 스페이스, 쉼표, 탭, 세미콜론 중에서 고릅니다. 스페이스는 gnuplot용 `.dat`, 탭은 `.tsv`, 나머지는 `.csv`로 저장됩니다.

## AI-assisted development

Plotdrop은 연구자의 기능 설계, 사용성 판단, 시험과 수정 지시를 바탕으로 OpenAI GPT/Codex의 코드 생성 지원을 받아 개발되었습니다. 이 사실은 라이선스 조건을 추가하지 않으며, 저장소의 배포 조건은 Apache License 2.0을 따릅니다.

## License

Copyright 2026 K. S. Choi.

Licensed under the [Apache License 2.0](LICENSE). Third-party components remain subject to their respective licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
