/**
 * 현장설문 15종 구글폼 자동 생성 스크립트
 * 실행 방법: Google Apps Script → 새 프로젝트 → 붙여넣기
 * 전체 생성: createAllFieldForms()
 * 개별 생성: createJ01Form(), createJ03Form() ... 각 함수 직접 실행
 *
 * 실행 결과: 각 사업별 구글폼 1개 + 전용 응답 스프레드시트 1개 자동 생성 및 연결
 * 공통 구조: 도입부 3문항 + 공통 4문항 + 특화 문항 (사업별 상이)
 * 척도: 1=전혀 그렇지 않다 ~ 5=매우 그렇다
 */

// ══════════════════════════════════════════════
// 전체 일괄 생성 (시간이 오래 걸릴 수 있음)
// ══════════════════════════════════════════════
function createAllFieldForms() {
  createJ01Form();
  createJ03Form();
  createJ04Form();
  createJ05Form();
  createJ06Form();
  createJ07Form();
  createJ08Form();
  createJ09Form();
  createJ10Form();
  createJ11Form();
  createJ12Form();
  createJ13Form();
  createJ14Form();
  createJ16Form();
  createJ17Form();
  Logger.log('현장설문 15종 전체 생성 완료');
}

// ══════════════════════════════════════════════
// 공통 헬퍼 함수
// ══════════════════════════════════════════════
function addSection(form, title) {
  form.addPageBreakItem().setTitle(title);
}
function addRadio(form, title, required, choices, hasOther) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setRequired(required);
  if (hasOther) item.showOtherOption(true);
  item.setChoiceValues(choices);
}
function addCheckbox(form, title, required, choices, hasOther) {
  var item = form.addCheckboxItem();
  item.setTitle(title).setRequired(required);
  if (hasOther) item.showOtherOption(true);
  item.setChoiceValues(choices);
}
function addScale(form, title, required) {
  var item = form.addScaleItem();
  item.setTitle(title).setRequired(required)
    .setBounds(1, 5)
    .setLabels('전혀 그렇지 않다', '매우 그렇다');
}
function addText(form, title, required) {
  form.addParagraphTextItem().setTitle(title).setRequired(required);
}

// 도입부 3문항 (전 사업 공통)
function addIntro(form) {
  addSection(form, '【도입부】 기본 정보');
  addRadio(form, '도입-1. 귀하의 연령대는?', true,
    ['20대', '30대', '40대', '50대', '60대 이상']);
  addRadio(form, '도입-2. 귀하의 노인맞춤돌봄서비스 경력은 몇 년입니까?', true,
    ['1년 미만', '1~3년', '3~5년', '5년 이상']);
  addRadio(form, '도입-3. 귀하의 소속 권역은?', true,
    ['북부 (거창·함양·합천·산청)', '서부 (진주·사천·고성·남해·하동)',
     '중부 (창원·함안·의령·창녕)', '동부 (김해·양산·밀양·통영·거제)']);
}

// 폼 완성 후 전용 스프레드시트 생성·연결 및 로그 출력
function finalizeForm(form, sheetTitle) {
  var ss = SpreadsheetApp.create(sheetTitle);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('=== ' + form.getTitle() + ' 생성 완료 ===');
  Logger.log('응답 URL: ' + form.getPublishedUrl());
  Logger.log('편집 URL: ' + form.getEditUrl());
  Logger.log('응답 시트: ' + ss.getUrl());
}

// ══════════════════════════════════════════════
// J01. 수행기관 모니터링·점검 (12문항)
// ══════════════════════════════════════════════
function createJ01Form() {
  var form = FormApp.create('[J01] 수행기관 모니터링·점검 현장설문');
  form.setDescription(
    '이 설문은 방금 실시된 수행기관 모니터링·점검에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 점검 방식과 피드백 품질 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 점검 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 점검 항목·기준에 대한 사전 안내가 충분하였습니까?', true);
  addScale(form, '공통-2. 광역 담당자가 우리 기관의 현장 상황을 충분히 파악하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'A-1. 이번 점검에서 확인한 항목이 우리 기관 실정에 맞게 반영되었습니까?', true);
  addScale(form, 'A-2. 점검 후 피드백이 구체적이고 현장에 적용 가능하였습니까?', true);
  addScale(form, 'A-3. 점검을 통해 기관 운영 개선 방향을 파악할 수 있었습니까?', true);
  addScale(form, 'A-4. 이번 점검 방식(현장 방문/서면/화상 등)이 업무 상황에 적합하였습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 점검이 기관 운영 개선에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 모니터링·점검에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'A-5. 모니터링·점검과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J01] 수행기관 모니터링·점검 응답');
}

// ══════════════════════════════════════════════
// J03. 역량강화교육 — 전담사회복지사 (10문항)
// ══════════════════════════════════════════════
function createJ03Form() {
  var form = FormApp.create('[J03] 역량강화교육 현장설문 — 전담사회복지사');
  form.setDescription(
    '이 설문은 방금 참여하신 역량강화교육에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 다음 교육의 주제·방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 교육 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 이번 교육 주제가 역량 강화에 필요한 내용으로 구성되었습니까?', true);
  addScale(form, '공통-2. 강사의 전문성과 강의 전달 방식이 적절하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'B1-1. 교육 일정·장소·방식이 업무 상황에서 참여하기 편리하였습니까?', true);
  addScale(form, 'B1-2. 이번 교육에서 배운 내용을 현장 업무에 적용할 수 있겠습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 교육이 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 역량강화교육에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'B1-3. 역량강화교육과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J03] 역량강화교육(전담) 응답');
}

// ══════════════════════════════════════════════
// J04. 역량강화교육 — 생활지원사 (11문항)
// ══════════════════════════════════════════════
function createJ04Form() {
  var form = FormApp.create('[J04] 역량강화교육 현장설문 — 생활지원사');
  form.setDescription(
    '이 설문은 방금 참여하신 역량강화교육에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '아울러 앞으로 받고 싶은 교육 주제를 여쭤보는 문항이 포함되어 있습니다. 응답 결과는 다음 교육 설계에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 교육 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 이번 교육 주제가 돌봄 역량 강화에 적합한 내용으로 구성되었습니까?', true);
  addScale(form, '공통-2. 강사의 전문성과 강의 전달 방식이 적절하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'B2-1. 교육 일정·장소·방식이 업무 상황에서 참여하기 편리하였습니까?', true);
  addScale(form, 'B2-2. 이번 교육에서 배운 내용을 돌봄 현장에 적용할 수 있겠습니까?', true);
  addRadio(form, 'B2-3. 앞으로 가장 필요한 교육 주제는 무엇입니까? (1개 선택)', true,
    ['이용자 안전사고 대응', '서비스 제공 실무', '감정노동·폭언 대처',
     'ICT 기기 활용', '치매 노인 질환 이해'],
    true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 교육이 돌봄 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 역량강화교육에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'B2-4. 역량강화교육과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J04] 역량강화교육(생활지원사) 응답');
}

// ══════════════════════════════════════════════
// J05. 심리지원교육 — 전담사회복지사 (11문항)
// ══════════════════════════════════════════════
function createJ05Form() {
  var form = FormApp.create('[J05] 심리지원교육 현장설문 — 전담사회복지사');
  form.setDescription(
    '이 설문은 방금 참여하신 심리지원교육에 대한 만족도와 효과를 수렴하기 위한 것입니다. ' +
    '응답 결과는 다음 교육 프로그램 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 교육 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 이번 교육 주제가 소진 예방·심리 회복에 적합한 내용으로 구성되었습니까?', true);
  addScale(form, '공통-2. 진행자의 전문성과 심리적으로 안전한 분위기 조성이 적절하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'B3-1. 교육 일정·장소·방식이 참여하기 편리하였습니까?', true);
  addScale(form, 'B3-2. 이번 교육이 감정노동 상황에 대처하는 데 도움이 되었습니까?', true);
  addScale(form, 'B3-3. 이번 교육 참여 후 심리적 부담감이 완화되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 교육이 소진 회복에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 심리지원교육에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'B3-4. 심리지원교육과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J05] 심리지원교육(전담) 응답');
}

// ══════════════════════════════════════════════
// J06. 심리지원교육 — 생활지원사 (12문항)
// ══════════════════════════════════════════════
function createJ06Form() {
  var form = FormApp.create('[J06] 심리지원교육 현장설문 — 생활지원사');
  form.setDescription(
    '이 설문은 방금 참여하신 심리지원교육에 대한 만족도와 효과를 수렴하기 위한 것입니다. ' +
    '아울러 앞으로 필요한 프로그램을 여쭤보는 문항이 포함되어 있습니다. 응답 결과는 다음 교육 설계에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 교육 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 이번 교육 주제가 소진 예방·심리 회복에 적합한 내용으로 구성되었습니까?', true);
  addScale(form, '공통-2. 진행자의 전문성과 심리적으로 안전한 분위기 조성이 적절하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'B4-1. 교육 일정·장소·방식이 참여하기 편리하였습니까?', true);
  addScale(form, 'B4-2. 이번 교육이 감정노동 상황에 대처하는 데 도움이 되었습니까?', true);
  addScale(form, 'B4-3. 이번 교육 참여 후 심리적 부담감이 완화되었습니까?', true);
  addRadio(form, 'B4-4. 앞으로 가장 필요한 심리지원 프로그램은 무엇입니까? (1개 선택)', true,
    ['소진 예방·자기돌봄', '감정노동 대처 기술', '동료 지지·자조모임',
     '전문 심리상담 연계', '여가·힐링 프로그램'],
    true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 교육이 소진 회복에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 심리지원교육에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'B4-5. 심리지원교육과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J06] 심리지원교육(생활지원사) 응답');
}

// ══════════════════════════════════════════════
// J07. 실무협의회 (10문항)
// ══════════════════════════════════════════════
function createJ07Form() {
  var form = FormApp.create('[J07] 실무협의회 현장설문');
  form.setDescription(
    '이 설문은 방금 진행된 실무협의회(간담회·정례회의 포함)에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 실무협의회 주제·운영 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 협의회 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 이번 협의회의 안건·주제가 현장 중심으로 사전에 충분히 안내되었습니까?', true);
  addScale(form, '공통-2. 수행기관의 의견·건의사항이 충분히 반영되었습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'C-1. 이번 협의회 진행 방식(장소·시간·방법)이 참여하기 편리하였습니까?', true);
  addScale(form, 'C-2. 수행기관 간 사례 공유 시간이 충분하였습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 협의회가 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 실무협의회에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'C-3. 실무협의회와 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J07] 실무협의회 응답');
}

// ══════════════════════════════════════════════
// J08. 컨설팅 지원 (10문항)
// ══════════════════════════════════════════════
function createJ08Form() {
  var form = FormApp.create('[J08] 컨설팅 지원 현장설문');
  form.setDescription(
    '이 설문은 이번에 이용하신 컨설팅 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 컨설팅 응대 방식과 내용 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 컨설팅 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?', true);
  addScale(form, '공통-2. 컨설팅 내용이 현장 문제 해결에 적합하였습니까?', true);
  addSection(form, '【특화 문항】');
  addRadio(form, 'D1-1. 이번 컨설팅을 이용한 주요 분야는 무엇입니까? (1개 선택)', true,
    ['서비스 제공 실무', '행정·서류 처리', '이용자 안전사고 대응', '노무·인사'],
    true);
  addScale(form, 'D1-2. 이번 컨설팅을 통해 현장 문제가 실질적으로 해결되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 컨설팅이 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 컨설팅 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'D1-3. 컨설팅 지원과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J08] 컨설팅 지원 응답');
}

// ══════════════════════════════════════════════
// J09. 특화지원서비스 (12문항)
// ══════════════════════════════════════════════
function createJ09Form() {
  var form = FormApp.create('[J09] 특화지원서비스 현장설문');
  form.setDescription(
    '이 설문은 광역지원기관의 특화지원서비스 운영 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 지원 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 지원 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 광역의 운영 기준·절차 안내가 충분하였습니까?', true);
  addScale(form, '공통-2. 광역 담당자에게 연락·지원 요청이 용이하였습니까?', true);
  addSection(form, '【특화 문항 — 광역 지원 4차원】');
  addScale(form, 'D2-1. 대상자 선별·발굴 과정에서 광역의 안내·지원이 도움이 되었습니까?', true);
  addScale(form, 'D2-2. 서비스 계획(개별·집단·치료) 수립 시 광역의 자문이 도움이 되었습니까?', true);
  addScale(form, 'D2-3. 어려운 사례 진행 중 광역의 슈퍼비전이 도움이 되었습니까?', true);
  addScale(form, 'D2-4. 외부 전문기관(치료·상담) 연계 정보 제공이 도움이 되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 지원이 특화지원서비스 운영 역량 향상에 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 특화지원서비스 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'D2-5. 특화지원서비스 지원과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J09] 특화지원서비스 응답');
}

// ══════════════════════════════════════════════
// J10. 퇴원환자 단기집중서비스 (9문항)
// ══════════════════════════════════════════════
function createJ10Form() {
  var form = FormApp.create('[J10] 퇴원환자 단기집중서비스 현장설문');
  form.setDescription(
    '이 설문은 광역지원기관의 퇴원환자 단기집중서비스 운영 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 지원 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 지원 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 퇴원환자 서비스 운영 시 광역 담당자와의 소통이 원활하였습니까?', true);
  addScale(form, '공통-2. 광역에서 제공한 실무 매뉴얼·가이드가 현장에 유용하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'D3-1. 이번 광역 지원을 통해 퇴원환자 서비스 운영 역량이 향상되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 지원이 퇴원환자 서비스 운영 역량 향상에 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 퇴원환자 서비스 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'D3-2. 퇴원환자 서비스 지원과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J10] 퇴원환자 단기집중서비스 응답');
}

// ══════════════════════════════════════════════
// J11. 노무 상담 지원 (10문항)
// ══════════════════════════════════════════════
function createJ11Form() {
  var form = FormApp.create('[J11] 노무 상담 지원 현장설문');
  form.setDescription(
    '이 설문은 이번에 이용하신 노무 상담 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 상담 서비스 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 상담 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?', true);
  addScale(form, '공통-2. 노무 상담 내용이 현장 문제 해결에 적합하였습니까?', true);
  addSection(form, '【특화 문항】');
  addRadio(form, 'D4-1. 이번에 상담한 주요 노무 유형은 무엇입니까? (1개 선택)', true,
    ['임금·수당 산정', '휴가·휴직 처리', '근로시간 관리', '징계·해고 절차',
     '폭언·폭행 피해의 산재·법적 절차 처리', '계약서·취업규칙'],
    true);
  addScale(form, 'D4-2. 이번 상담을 통해 노무 문제가 실질적으로 해결되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 상담이 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 노무 상담 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'D4-3. 노무 상담 지원과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J11] 노무 상담 지원 응답');
}

// ══════════════════════════════════════════════
// J12. ICT 지원사업 (10문항)
// ══════════════════════════════════════════════
function createJ12Form() {
  var form = FormApp.create('[J12] ICT 지원사업 현장설문');
  form.setDescription(
    '이 설문은 광역지원기관의 ICT(AI·디지털 기기) 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 지원 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 지원 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 광역의 운영 지침·안내 자료가 충분히 제공되었습니까?', true);
  addScale(form, '공통-2. ICT 기기 관련 문의에 대한 응대가 신속하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'E1-1. 이번 지원을 통해 이용자 대상 기기 교육·관리가 수월해졌습니까?', true);
  addScale(form, 'E1-2. 이번 지원을 통해 이용자 교육 자료·가이드가 충분히 제공되었습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 지원이 현장 업무에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 ICT 지원사업에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'E1-3. ICT 지원사업과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J12] ICT 지원사업 응답');
}

// ══════════════════════════════════════════════
// J13. THE(더) 나눔사업 (10문항)
// ══════════════════════════════════════════════
function createJ13Form() {
  var form = FormApp.create('[J13] THE(더) 나눔사업 현장설문');
  form.setDescription(
    '이 설문은 광역지원기관의 나눔사업 물품 배부 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 배부 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 배부 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 물품 배부 일정·신청 절차에 대한 사전 안내가 충분하였습니까?', true);
  addScale(form, '공통-2. 배부 집결 장소·시간이 참여하기 편리하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'E2-1. 이번에 배부된 물품이 이용자 서비스 제공에 적합하였습니까?', true);
  addScale(form, 'E2-2. 전반적인 배부 과정(접수·대기·수령)이 원활하였습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 배부 물품이 이용자 서비스 제공에 실질적으로 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 THE(더) 나눔사업에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'E2-3. 나눔사업과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J13] THE(더) 나눔사업 응답');
}

// ══════════════════════════════════════════════
// J14. 안심 돌봄 캠페인 (11문항)
// ══════════════════════════════════════════════
function createJ14Form() {
  var form = FormApp.create('[J14] 안심 돌봄 캠페인 현장설문');
  form.setDescription(
    '이 설문은 이번 안심 돌봄 캠페인에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 캠페인 운영 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 회차 캠페인 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 홍보물·배포 자료·일정이 사전에 충분히 제공되었습니까?', true);
  addScale(form, '공통-2. 캠페인 진행 방식·일정·장소가 적절하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'E3-1. 이번 캠페인에서 제공된 홍보 물품이 이용자·주민 관심을 끌기에 적합하였습니까?', true);
  addCheckbox(form, 'E3-2. 이번 캠페인에서 활용된 홍보 물품 종류는 무엇입니까? (해당 항목 모두 선택)', false,
    ['생활용품(미니 선풍기·핫팩·우산 등)', '식품·간식류(음료·과자·건강식품 등)',
     '위생용품(마스크·손소독제·치약 등)', '문구·생활잡화(수건·볼펜·노트 등)',
     '계절용품(여름 아이스팩·겨울 방한용품 등)', '해당 없음'],
    true);
  addRadio(form, 'E3-3. 이번 캠페인에서 가장 효과적이었던 홍보 채널은?', true,
    ['사회관계망서비스(카카오·인스타그램 등)', '지역 언론·신문',
     '현수막·포스터', '기타'],
    true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 캠페인이 서비스 인식 제고에 효과가 있었습니까?', true);
  addScale(form, '공통-4. 이번 안심 돌봄 캠페인에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'E3-4. 안심 돌봄 캠페인과 관련하여 광역에 바라는 점 또는 자긍심 강화 행사 아이디어를 적어주세요.', false);
  finalizeForm(form, '[J14] 안심 돌봄 캠페인 응답');
}

// ══════════════════════════════════════════════
// J16. 유공자 표창 (10문항)
// ══════════════════════════════════════════════
function createJ16Form() {
  var form = FormApp.create('[J16] 유공자 표창 현장설문');
  form.setDescription(
    '이 설문은 이번 유공자 표창 추천 지원에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 추천 절차 지원 방식 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 추천 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 추천 기준·절차에 대한 안내가 충분하였습니까?', true);
  addScale(form, '공통-2. 추천 절차 진행 시 광역 담당자의 응대가 신속하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'F2-1. 광역 제공 자료(공적 기술서 양식·가이드 등)가 추천 과정에 도움이 되었습니까?', true);
  addScale(form, 'F2-2. 이번 추천 경험을 바탕으로 앞으로도 자율적으로 후보자를 발굴·추천할 의향이 있습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 유공자 표창이 종사자 사기 진작에 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 유공자 표창 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'F2-3. 유공자 표창과 관련하여 광역에 바라는 점 또는 자긍심 강화 행사 아이디어를 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J16] 유공자 표창 응답');
}

// ══════════════════════════════════════════════
// J17. 종사자 지원사업 (10문항)
// ══════════════════════════════════════════════
function createJ17Form() {
  var form = FormApp.create('[J17] 종사자 지원사업 현장설문');
  form.setDescription(
    '이 설문은 광역지원기관의 종사자 지원사업 안내·중간 전달에 대한 만족도와 경험을 수렴하기 위한 것입니다. ' +
    '응답 결과는 안내 방식과 절차 개선에 직접 반영됩니다.\n\n' +
    '▪ 소요 시간: 약 3~5분\n▪ 이번 지원 경험을 기준으로 응답해 주세요.'
  );
  addIntro(form);
  addSection(form, '【공통 문항】');
  addScale(form, '공통-1. 종사자 지원사업 관련 사전 안내가 충분하고 적시에 이루어졌습니까?', true);
  addScale(form, '공통-2. 신청 절차 진행 시 광역 담당자의 응대가 신속하였습니까?', true);
  addSection(form, '【특화 문항】');
  addScale(form, 'F3-1. 광역의 안내를 통해 지원사업 내용을 명확하게 이해할 수 있었습니까?', true);
  addScale(form, 'F3-2. 신청 절차가 번거롭지 않고 편리하였습니까?', true);
  addSection(form, '【공통 문항 (계속)】');
  addScale(form, '공통-3. 이번 광역의 중간 전달·안내가 수행기관 운영에 도움이 되었습니까?', true);
  addScale(form, '공통-4. 이번 종사자 지원사업 지원에 대한 종합 만족도는 어느 정도입니까?', true);
  addText(form, 'F3-3. 종사자 지원사업과 관련하여 광역에 바라는 점을 자유롭게 적어주세요.', false);
  finalizeForm(form, '[J17] 종사자 지원사업 응답');
}
