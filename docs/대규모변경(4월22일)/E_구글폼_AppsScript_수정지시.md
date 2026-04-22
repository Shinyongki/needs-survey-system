# E. 구글폼 Apps Script 수정 지시문

> 세션: E
> 선수 조건: `00_공통_변경사항_요약.md` 전체 읽고 이해
> 예상 소요: 1개 세션
> **※ 이 세션의 산출물은 실제 Apps Script를 실행 가능한 형태로 작성하는 것.
>    구글폼 17종(통합 2 + 현장 15)의 구조 변경을 반영.**

---

## 🎯 세션 목적

17종 구글폼을 새 설문 체계(기관명 드롭다운·회차 드롭다운·권역 문항 삭제)에 맞게 재생성하는 Apps Script를 작성한다.

---

## 📂 작업 대상 구글폼 (17종)

| 유형 | 구글폼 | 도입부 문항 수 |
|------|--------|---------------|
| 통합설문 | S01 상반기 | 6 (기본-00 추가, 기본-2 삭제) |
| 통합설문 | S02 하반기 | 6 (기본-00 추가, 기본-2 삭제) |
| 현장설문 | J01 모니터링·점검 | 4 (도입-0·도입-0-a·도입-1·도입-2) |
| 현장설문 | J03 역량강화교육 (전담) | 4 |
| 현장설문 | J04 역량강화교육 (생활) | 4 |
| 현장설문 | J05 심리지원교육 (전담) | 4 |
| 현장설문 | J06 심리지원교육 (생활) | 4 |
| 현장설문 | J07 실무협의회 | 4 |
| 현장설문 | J08 컨설팅 지원 | 4 |
| 현장설문 | J09 특화지원서비스 | 4 |
| 현장설문 | J10 퇴원환자 단기집중 | 4 |
| 현장설문 | J11 노무 상담 지원 | 4 |
| 현장설문 | J12 ICT 지원사업 | 4 |
| 현장설문 | J13 THE 나눔사업 | 4 |
| 현장설문 | J14 안심 돌봄 캠페인 | 4 |
| 현장설문 | J16 유공자 표창 | **3** (회차 문항 없음) |
| 현장설문 | J17 종사자 지원사업 | **3** (회차 문항 없음) |

---

## ✍ 작업 내용

### 1. Apps Script 구조 설계

**권장 파일 구조** (Google Apps Script 프로젝트)

```
설문생성_v2/
├ main.gs                  // 전체 실행 컨트롤러
├ config.gs                // 상수·환경 설정
├ institutions.gs          // 59개 기관 드롭다운 데이터
├ introSection.gs          // 도입부 섹션 생성 (통합/현장 각각)
├ s01_hansanggi.gs         // S01 상반기 통합설문 문항 정의
├ s02_hasanggi.gs          // S02 하반기 통합설문 문항 정의
├ j01_monitoring.gs        // J01 ~ J17 각 현장설문 문항 정의
├ j03_education_jd.gs
├ ... (J04·J05·...·J17)
├ rounds.gs                // 회차 드롭다운 데이터 관리
├ utils.gs                 // 공통 유틸 함수 (폼 생성, 헤더 설정 등)
└ test.gs                  // 테스트 함수
```

### 2. 공통 상수 (config.gs)

```javascript
const CONFIG = {
  // 기관 드롭다운: 59개 고정 (00_공통_변경사항_요약.md의 순서 그대로)
  INSTITUTION_DROPDOWN: [
    '[거제시] 거제노인통합지원센터',
    '[거제시] 거제사랑노인복지센터',
    '[거제시] 은빛노인통합지원센터',
    '[거제시] 하청교회 행복늘푸른대학',
    '[거창군] 거창노인통합지원센터',
    '[거창군] 거창인애노인통합지원센터',
    '[거창군] 해월노인복지센터',
    '[고성군] 대한노인회 고성군지회(노인맞춤돌봄서비스)',
    '[고성군] 사회적협동조합 노인세상',
    '[김해시] 김해돌봄지원센터',
    '[김해시] 김해시종합사회복지관',
    '[김해시] 보현행원노인통합지원센터',
    '[김해시] 생명의전화노인통합지원센터',
    '[김해시] 효능원노인통합지원센터',
    '[남해군] 화방남해노인통합지원센터',
    '[남해군] 화방재가복지센터',
    '[밀양시] 밀양노인통합지원센터',
    '[밀양시] 밀양시자원봉사단체협의회',
    '[밀양시] 우리들노인통합지원센터',
    '[사천시] 남양양로원',
    '[사천시] 사랑원노인지원센터',
    '[사천시] 사천건양주야간보호센터',
    '[사천시] 사천노인통합지원센터',
    '[산청군] 산청복음노인통합지원센터',
    '[산청군] 산청성모노인통합지원센터',
    '[산청군] 산청한일노인통합지원센터',
    '[산청군] 산청해민노인통합지원센터',
    '[양산시] 사회복지법인신생원양산재가노인복지센터',
    '[양산시] 성요셉소규모노인종합센터',
    '[양산시] 양산행복한돌봄 사회적협동조합',
    '[의령군] 의령노인통합지원센터',
    '[진주시] 공덕의집노인통합지원센터',
    '[진주시] 나누리노인통합지원센터',
    '[진주시] 진양노인통합지원센터',
    '[진주시] 진주노인통합지원센터',
    '[진주시] 하늘마음노인통합지원센터',
    '[창녕군] 창녕군새누리노인종합센터',
    '[창녕군] 창녕지역자활센터',
    '[창원시] 경남고용복지센터',
    '[창원시] 경남노인통합지원센터',
    '[창원시] 동진노인통합지원센터',
    '[창원시] 마산회원노인종합복지관',
    '[창원시] 명진노인통합지원센터',
    '[창원시] 정현사회적협동조합',
    '[창원시] 진해노인종합복지관',
    '[창원시] 진해서부노인종합복지관',
    '[창원시] 창원도우누리노인통합재가센터',
    '[창원시] 플러스희망 사회적협동조합',
    '[통영시] 통영노인통합지원센터',
    '[통영시] 통영시종합사회복지관',
    '[하동군] 경남하동지역자활센터',
    '[하동군] 하동노인통합지원센터',
    '[함안군] (사)대한노인회함안군지회',
    '[함안군] 함안군재가노인통합지원센터',
    '[함양군] 사단법인 대한노인회 함양군지회',
    '[합천군] 미타재가복지센터',
    '[합천군] 사회적협동조합 합천종합복지공동체',
    '[합천군] 코끼리행복복지센터',
    '[합천군] 합천노인통합지원센터'
  ],
  
  // 연령대·경력 선택지 (공통)
  AGE_GROUPS: ['20대', '30대', '40대', '50대', '60대 이상'],
  CAREERS: ['1년 미만', '1~3년', '3~5년', '5년 이상'],
  
  // 회차 드롭다운 없는 사업 (도입부 3문항)
  SURVEYS_WITHOUT_ROUND: ['J16', 'J17'],
  
  // 각 J코드 기본 회차 선택지 (연초 템플릿, 운영 중 추가)
  INITIAL_ROUNDS: {
    J01: ['2026년 상반기 점검 (2026-04~06)', '2026년 하반기 점검 (2026-10~12)'],
    J07: ['북부권역 (거창·함양·합천·산청) - 2026-06-15'],  // 예시
    // 나머지는 초기 비어있음 (운영 중 Apps Script로 추가)
  }
};
```

### 3. 도입부 생성 함수 (introSection.gs)

```javascript
/**
 * 통합설문(S01·S02) 도입부 6문항 추가
 * 기본-00 기관명 / 기본-0 연령대 / 기본-1 경력 / 현공-1·2·3
 */
function addIntegratedSurveyIntro(form, isFirstHalf) {
  // 기본-00: 소속 기관
  form.addListItem()
    .setTitle('귀하의 소속 기관은?')
    .setHelpText('드롭다운에서 선택해주세요.')
    .setChoiceValues(CONFIG.INSTITUTION_DROPDOWN)
    .setRequired(true);
  
  // 기본-0: 연령대
  form.addMultipleChoiceItem()
    .setTitle('귀하의 연령대는?')
    .setChoiceValues(CONFIG.AGE_GROUPS)
    .setRequired(true);
  
  // 기본-1: 경력
  form.addMultipleChoiceItem()
    .setTitle('귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)')
    .setChoiceValues(CONFIG.CAREERS)
    .setRequired(true);
  
  // 현공-1·2·3 (설문별로 다름 — 각 설문 파일에서 추가)
}

/**
 * 현장설문 도입부
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} jCode - J01, J03, ..., J17
 * @param {string[]} rounds - 회차 드롭다운 선택지 (J16·J17은 빈 배열)
 */
function addFieldSurveyIntro(form, jCode, rounds) {
  // 도입-0: 소속 기관 (공통)
  form.addListItem()
    .setTitle('귀하의 소속 기관은?')
    .setHelpText('드롭다운에서 선택해주세요.')
    .setChoiceValues(CONFIG.INSTITUTION_DROPDOWN)
    .setRequired(true);
  
  // 도입-0-a: 회차 (J16·J17 제외)
  if (!CONFIG.SURVEYS_WITHOUT_ROUND.includes(jCode)) {
    if (rounds && rounds.length > 0) {
      form.addListItem()
        .setTitle('이번 참여하신 회차/일정은?')
        .setHelpText('해당하는 회차/일정을 드롭다운에서 선택해주세요.')
        .setChoiceValues(rounds)
        .setRequired(true);
    } else {
      // 초기 회차가 아직 없는 경우: 임시 옵션
      form.addListItem()
        .setTitle('이번 참여하신 회차/일정은?')
        .setHelpText('회차/일정이 아직 등록되지 않았습니다. 광역에 문의 후 응답해주세요.')
        .setChoiceValues(['회차 등록 대기'])
        .setRequired(true);
    }
  }
  
  // 도입-1: 연령대
  form.addMultipleChoiceItem()
    .setTitle('귀하의 연령대는?')
    .setChoiceValues(CONFIG.AGE_GROUPS)
    .setRequired(true);
  
  // 도입-2: 경력
  form.addMultipleChoiceItem()
    .setTitle('귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까? (타 기관 근무 경력 포함)')
    .setChoiceValues(CONFIG.CAREERS)
    .setRequired(true);
}
```

### 4. 회차 추가 유틸리티 (rounds.gs)

```javascript
/**
 * 기존 구글폼에 새 회차 선택지 추가 (운영 중 사용)
 * 용기/광역 담당자가 회차 시작 전에 실행
 */
function addRoundToForm(formId, newRoundLabel) {
  const form = FormApp.openById(formId);
  const items = form.getItems(FormApp.ItemType.LIST);
  
  // 회차 문항 식별 (제목이 "이번 참여하신 회차..."로 시작)
  const roundItem = items.find(item => 
    item.asListItem().getTitle().includes('이번 참여하신 회차')
  );
  
  if (!roundItem) {
    throw new Error('회차 문항을 찾을 수 없습니다. 폼 ID 확인: ' + formId);
  }
  
  const listItem = roundItem.asListItem();
  const existingChoices = listItem.getChoices().map(c => c.getValue());
  
  // 이미 존재하는 회차인지 확인
  if (existingChoices.includes(newRoundLabel)) {
    Logger.log('이미 존재하는 회차: ' + newRoundLabel);
    return;
  }
  
  // "회차 등록 대기" 임시 옵션 제거
  const cleanedChoices = existingChoices.filter(c => c !== '회차 등록 대기');
  cleanedChoices.push(newRoundLabel);
  
  listItem.setChoiceValues(cleanedChoices);
  Logger.log('회차 추가 완료: ' + newRoundLabel + ' → ' + formId);
}

/**
 * 예시: J03에 2차 회차 추가
 */
function addRoundExample() {
  addRoundToForm('FORM_ID_J03', '2차 (2026-07-20)');
}
```

### 5. 전체 폼 생성 스크립트 (main.gs)

```javascript
/**
 * 17종 구글폼 일괄 생성 (최초 실행)
 */
function createAllForms() {
  const createdForms = {};
  
  // 통합설문 2종
  createdForms.S01 = createS01Form();
  createdForms.S02 = createS02Form();
  
  // 현장설문 15종
  createdForms.J01 = createJ01Form();
  createdForms.J03 = createJ03Form();
  createdForms.J04 = createJ04Form();
  createdForms.J05 = createJ05Form();
  createdForms.J06 = createJ06Form();
  createdForms.J07 = createJ07Form();
  createdForms.J08 = createJ08Form();
  createdForms.J09 = createJ09Form();
  createdForms.J10 = createJ10Form();
  createdForms.J11 = createJ11Form();
  createdForms.J12 = createJ12Form();
  createdForms.J13 = createJ13Form();
  createdForms.J14 = createJ14Form();
  createdForms.J16 = createJ16Form();  // 회차 없음
  createdForms.J17 = createJ17Form();  // 회차 없음
  
  // 생성된 폼 ID 로그
  Logger.log('=== 생성된 폼 목록 ===');
  Object.entries(createdForms).forEach(([code, form]) => {
    Logger.log(`${code}: ${form.getId()} - ${form.getEditUrl()}`);
  });
  
  return createdForms;
}

/**
 * 각 폼 생성 함수 템플릿
 */
function createJ03Form() {
  const form = FormApp.create('J03 역량강화교육 (전담사회복지사) 현장설문');
  form.setDescription(
    '본 설문은 이번 역량강화교육에 대한 만족도를 수렴하기 위한 것입니다.\n' +
    '응답은 익명으로 수집되며 분석 외 목적으로 사용되지 않습니다.'
  );
  
  // 도입부 4문항 (기관·회차·연령·경력)
  addFieldSurveyIntro(form, 'J03', CONFIG.INITIAL_ROUNDS.J03 || []);
  
  // 설명 섹션
  form.addSectionHeaderItem()
    .setTitle('이번 회차 경험 평가')
    .setHelpText('이번 역량강화교육에 대해 답해주세요.');
  
  // 공통-1·2·3·4 (5점 척도)
  addCommonFieldQuestions(form, 'J03');
  
  // 특화 문항 B1-1·B1-2 (척도)
  form.addScaleItem()
    .setTitle('B1-1: 교육 운영 방식(집합·온라인 등)이 참여하기 편리하였습니까?')
    .setBounds(1, 5)
    .setLabels('매우 그렇지 않다', '매우 그렇다')
    .setRequired(true);
  
  form.addScaleItem()
    .setTitle('B1-2: 배운 내용을 현장에 적용할 수 있겠습니까?')
    .setBounds(1, 5)
    .setLabels('매우 그렇지 않다', '매우 그렇다')
    .setRequired(true);
  
  // 주관식 B1-3
  form.addParagraphTextItem()
    .setTitle('B1-3: 교육 관련 광역에 바라는 점을 적어주세요.');
  
  // 응답 스프레드시트 연결
  const ss = SpreadsheetApp.create('J03 역량강화교육 전담 응답');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  return form;
}

// 나머지 J01, J04 ~ J17, S01, S02 함수 동일 패턴으로 작성
```

### 6. CSV 헤더 형식 (Claude Code 연동)

구글폼 응답 스프레드시트의 **헤더 형식**이 Claude Code의 CSV 파싱 로직과 일치해야 함.

**기대 헤더 예시 (J03)**
```
타임스탬프 | 도입-0_소속기관 | 도입-0-a_회차 | 도입-1_연령대 | 도입-2_경력 | 공통-1_... | 공통-2_... | 공통-3_... | 공통-4_... | B1-1_... | B1-2_... | B1-3_바라는점
```

**주의**:
- Apps Script에서 setTitle에 `도입-0_소속기관` 등의 내부 코드를 직접 넣지 않음 (응답자에게 노출)
- 대신 응답 스프레드시트에 별도 시트를 만들어 컬럼 매핑 정의
- 또는 Claude Code에서 타이틀 기반 매핑 로직 구현

**권장 방식**: Apps Script 실행 시 스프레드시트 2번째 시트에 매핑 정의
```javascript
function createHeaderMapping(ss, jCode) {
  const mappingSheet = ss.insertSheet('header_mapping');
  mappingSheet.appendRow(['구글폼 문항', '내부 코드']);
  mappingSheet.appendRow(['귀하의 소속 기관은?', '도입-0']);
  mappingSheet.appendRow(['이번 참여하신 회차/일정은?', '도입-0-a']);
  mappingSheet.appendRow(['귀하의 연령대는?', '도입-1']);
  mappingSheet.appendRow(['귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까?', '도입-2']);
  mappingSheet.appendRow(['공통-1: ...', '공통-1']);
  // ... 각 J코드별 매핑
}
```

### 7. 기존 폼 수정 vs 재생성 전략

**용기 선택 필요**:
- **옵션 A**: 기존 17종 폼 삭제 후 신규 생성 → 구조 깔끔, URL 변경 필요
- **옵션 B**: 기존 폼에 기관명·회차 문항 추가, 권역 문항 삭제 → URL 유지, 기존 응답 보존

**권장: 옵션 A (재생성)**
- 구조 변경이 크므로 재생성이 안전
- 기존 응답은 CSV로 내보내기 후 백업
- URL 새로 배포 필요 (수행기관에 안내 필요)

### 8. 배포 체크리스트

- [ ] config.gs에 59개 기관 드롭다운 정확 기재
- [ ] 17종 폼 각각 createXXXForm() 함수 작성
- [ ] 각 폼 타이틀·설명 정확 기재
- [ ] 각 폼 응답 스프레드시트 생성 및 연결
- [ ] J16·J17 폼에 회차 문항 없음 확인
- [ ] J01 폼 회차 드롭다운에 상·하반기 2개 초기 등록
- [ ] J07 폼 회차 드롭다운 권역 명시 형식 적용
- [ ] J08 폼 타이틀/설명에 "집합교육컨설팅만" 명시
- [ ] J11 폼 타이틀/설명에 "중앙 노무사 초빙 집합교육만" 명시
- [ ] addRoundToForm() 테스트 실행
- [ ] CSV 헤더 매핑 시트 생성
- [ ] 전체 폼 URL 목록 정리하여 배포 문서 작성

---

## 📤 최종 산출물

**파일명**: `구글폼_Apps_Script_재생성_v2.gs` (또는 프로젝트 단위 zip)

**구성 요소**:
1. config.gs (상수, 59개 기관, 회차 초기 데이터)
2. institutions.gs (기관 관련 유틸)
3. introSection.gs (도입부 생성 함수)
4. rounds.gs (회차 관리 함수)
5. s01_hansanggi.gs, s02_hasanggi.gs (통합설문 2종)
6. j01 ~ j17 (J코드별 현장설문 15종, J02·J15 제외)
7. utils.gs (공통 유틸)
8. main.gs (전체 실행 컨트롤러)

---

## ✅ 세션 E 완료 체크리스트

- [ ] Apps Script 전체 파일 구조 작성 완료
- [ ] config.gs에 59개 기관 드롭다운 정확 기재
- [ ] 도입부 공통 함수 작성
- [ ] 17종 폼 생성 함수 전부 작성
- [ ] 회차 관리 함수 작성
- [ ] CSV 헤더 매핑 시트 생성 로직 포함
- [ ] 테스트 함수 작성
- [ ] 주의사항 및 배포 체크리스트 명시

---

## 🔍 세션 E 작업 시 주의

1. **구글폼 제약 준수**:
   - 드롭다운 최대 200개 선택지 (59개는 여유)
   - 필수 문항 설정 (required: true)
   - 설명란(HelpText)으로 응답자 안내

2. **Apps Script 권한**: FormApp, SpreadsheetApp 등 서비스 권한 확인

3. **기존 응답 데이터 보존**: 재생성 시 기존 CSV 백업 필수

4. **J08·J11 사용 제약 명시**: 폼 타이틀·설명에 범위 제한 안내

5. **회차 드롭다운 "회차 등록 대기" 처리**: 
   - 초기 등록 없는 J코드에 임시 옵션 제공
   - 첫 회차 추가 시 임시 옵션 자동 제거

---

## 🔄 Apps Script 실행 흐름

```
1. config.gs 확인 (59개 기관 검증)
2. main.gs의 createAllForms() 실행
3. 17종 폼 생성 + 응답 스프레드시트 연결
4. 각 폼 URL 로그 수집
5. 용기에게 17종 폼 URL 리스트 전달
6. 수행기관에 배포
7. 회차 진행 시 addRoundToForm() 호출하여 드롭다운 업데이트
```

---

## 끝
