# **Crack Chat Downloader (크랙 채팅 다운로더)**

크랙(Crack) 캐릭터 채팅 **대화 내용 저장**(HTML/TXT/JSON), **클립보드 복사** 기능을 추가하는 유저스크립트입니다.

## 소개

  -  **Crack_Chat_Downloader**: 원본 코드입니다. 이쪽을 설치하세요.
  -  **Test_Code**: 추가 기능 실험을 위한 테스트 코드입니다.

### 기능 소개
  - 🎯 **턴 지정 가능**: 저장하고 싶은 만큼 자유롭게 저장
  - 🖼️ **마크다운 적용**: `HTML` 파일 마크다운(이미지/코드블록...) 지원
  - 🗑️ **HTML 편집**: 메시지 삭제 및 저장 기능 지원
  - 📱 **모바일 지원**: 모바일 최적화 적용

## 설치하기

### ⚙️ 확장 프로그램 설치

스크립트 사용을 위해, 먼저 유저스크립트 매니저를 설치합니다.

-   [**Tampermonkey**](https://www.tampermonkey.net/)에서 사용 중인 브라우저에 맞는 버전 설치

### 🔧 유저스크립트 설치

아래 버튼을 클릭하거나, 직접 설치 링크를 복사하여 유저스크립트를 설치합니다.

[![Static Badge](https://img.shields.io/badge/%E2%9A%99%EF%B8%8F%20INSTALL-crack_chat_downloader-blue?style=for-the-badge)](https://github.com/kktcct001/crack_chat_downloader/raw/refs/heads/main/Crack_Chat_Downloader-2.0.user.js)

**직접 설치 링크**:
```
https://raw.githubusercontent.com/kktcct001/crack_chat_downloader/refs/heads/main/Crack_Chat_Downloader-2.0.user.js
```

## 사용하기

### 1. 대화 내용 저장

유저스크립트 설치 후, 페이지를 새로고침 하면 화면에 **대화 내용 저장** 버튼이 추가됩니다.

  -  [**PC**]  채팅방 상단 헤더에 위치
  -  [**모바일**]  채팅방 설정 메뉴 하단에 위치

> Q. 모바일에서 채팅방 설정 메뉴 하단이 잘립니다.
>
> 메뉴에 스크롤 기능이 적용되어 있습니다. 아래로 스크롤하여 버튼을 클릭하세요.

### 2. 대화 저장 설정

대화 내용 저장 버튼 클릭 후, **대화 저장 설정** 창에서 원하는 옵션을 선택합니다.

  -  [**저장할 턴**]  최소 1턴부터 최대 1000턴까지 입력
  -  [**저장할 순서**] `시작 대화 + n(저장할 턴)`만큼 저장할지, `최신 대화 - n(저장할 턴)`만큼 저장할지 선택
  -  [**저장할 파일**]  `HTML` `TXT` `JSON` 버튼 클릭 → 자동 다운로드
  -  [**클립보드에 복사하기**]  체크하고 다운로드 → 클립보드에 자동 복사

> ❕ **HTML**은 아래로 내려갈수록 시작 대화에서 최신 대화로, **순서대로 정렬되어 있습니다**.
> 
> ❕ **TXT**/**JSON**은 아래로 내려갈수록 최신 대화에서 시작 대화로, **역순으로 정렬되어 있습니다**.

---

  -  저장 양식

     `HTML` > 크랙 채팅방과 비슷한 UI로 저장
     
     `TXT` > 클립보드에 같은 양식으로 복사
     ```
     [assistant message] // 역할 구분
     채팅 내용

     === // 구분자

     [user message]
     채팅 내용
     ```
     
     `JSON` > 클립보드에 같은 양식으로 복사
     ```
     [
       {
         "role": "역할 구분",
         "content": "채팅 내용"
       }
     ]
     ```
