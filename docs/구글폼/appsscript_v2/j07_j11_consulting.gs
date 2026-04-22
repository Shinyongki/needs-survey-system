/**
 * ============================================================================
 * j07_j11_consulting.gs — 실무협의·컨설팅·지원 관련 5종
 * ----------------------------------------------------------------------------
 *  J07 실무협의회 (11문항)
 *  J08 컨설팅 지원 (11문항) — 집합교육컨설팅만 설문 수집
 *  J09 특화지원서비스 (13문항)
 *  J10 퇴원환자 단기집중서비스 (10문항)
 *  J11 노무 상담 지원 (11문항) — 중앙 노무사 초빙 집합교육만 설문 수집
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// J07 실무협의회 (11문항)
// ---------------------------------------------------------------------------
function createJ07Form() {
  const form = FormApp.create('J07 실무협의회 현장설문');
  form.setDescription(
    '본 설문은 이번 실무협의회(간담회, 정례회의 등)에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J07', CONFIG.INITIAL_ROUNDS.J07);

  addSection(form, '이번 실무협의회 평가',
    '다음 문항은 이번 실무협의회(간담회, 정례회의 등)에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 실무협의회 사전에 안건·주제가 수행기관 현장 현안 중심으로 충분히 안내되었습니까?');
  addAgreeScale(form, '[공통-2] 실무협의회에서 수행기관 의견과 건의사항이 충분히 다루어졌습니까?');
  addAgreeScale(form, '[공통-3] 실무협의회가 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 실무협의회에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[C-1] 진행 방식(대면·비대면)과 개최 지역·시간대가 참여하기 편리하였습니까?');
  addAgreeScale(form, '[C-2] 수행기관 간 사례 공유 시간이 충분하였습니까?');
  addLongText(form, '[C-3] 실무협의회 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J07 실무협의회');
  const mappings = getFieldIntroMappings('J07').concat([
    { title: '[공통-1] 실무협의회 사전에 안건·주제가 수행기관 현장 현안 중심으로 충분히 안내되었습니까?', code: '공통-1' },
    { title: '[공통-2] 실무협의회에서 수행기관 의견과 건의사항이 충분히 다루어졌습니까?', code: '공통-2' },
    { title: '[공통-3] 실무협의회가 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 실무협의회에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[C-1] 진행 방식(대면·비대면)과 개최 지역·시간대가 참여하기 편리하였습니까?', code: 'C-1' },
    { title: '[C-2] 수행기관 간 사례 공유 시간이 충분하였습니까?', code: 'C-2' },
    { title: '[C-3] 실무협의회 관련 광역에 바라는 점을 적어주세요.', code: 'C-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J07 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J08 컨설팅 지원 (11문항) — 집합교육컨설팅만 대상
// ---------------------------------------------------------------------------
function createJ08Form() {
  const form = FormApp.create('J08 컨설팅 지원 현장설문 (집합교육컨설팅)');
  form.setDescription(
    '본 설문은 이번 집합교육컨설팅에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '※ 개별 방문 컨설팅(3~4명 대면)은 본 설문 대상에서 제외됩니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J08', CONFIG.INITIAL_ROUNDS.J08);

  addSection(form, '이번 컨설팅 평가',
    '다음 문항은 이번 컨설팅 지원에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 컨설팅 요청 후 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?');
  addAgreeScale(form, '[공통-2] 컨설팅 내용이 실제 현장 문제 상황에 맞게 제공되었습니까?');
  addAgreeScale(form, '[공통-3] 컨설팅이 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 컨설팅에 대한 종합 만족도는 어느 정도입니까?');

  addSingleChoice(form,
    '[D1-1] 이번에 지원받은 컨설팅 분야는?',
    ['서비스 제공 실무', '행정·서류 처리', '이용자 안전사고 대응', '노무·인사'],
    true
  );
  addAgreeScale(form, '[D1-2] 컨설팅 후 문제가 실질적으로 해결되었습니까?');
  addLongText(form, '[D1-3] 컨설팅 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J08 컨설팅 지원');
  const mappings = getFieldIntroMappings('J08').concat([
    { title: '[공통-1] 컨설팅 요청 후 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?', code: '공통-1' },
    { title: '[공통-2] 컨설팅 내용이 실제 현장 문제 상황에 맞게 제공되었습니까?', code: '공통-2' },
    { title: '[공통-3] 컨설팅이 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 컨설팅에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[D1-1] 이번에 지원받은 컨설팅 분야는?', code: 'D1-1' },
    { title: '[D1-2] 컨설팅 후 문제가 실질적으로 해결되었습니까?', code: 'D1-2' },
    { title: '[D1-3] 컨설팅 관련 광역에 바라는 점을 적어주세요.', code: 'D1-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J08 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J09 특화지원서비스 (13문항)
// ---------------------------------------------------------------------------
function createJ09Form() {
  const form = FormApp.create('J09 특화지원서비스 현장설문');
  form.setDescription(
    '본 설문은 이번 특화지원서비스 운영 지원에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 13문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J09', CONFIG.INITIAL_ROUNDS.J09);

  addSection(form, '이번 지원 평가',
    '다음 문항은 이번 특화지원서비스 운영 지원에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 광역지원기관이 특화지원서비스 운영 기준과 절차를 충분히 안내하였습니까?');
  addAgreeScale(form, '[공통-2] 지원이 필요할 때 광역 담당자에게 신속하게 연락하고 도움을 받을 수 있었습니까?');
  addAgreeScale(form, '[공통-3] 광역의 지원이 특화지원서비스 운영 역량 향상에 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 광역의 특화지원서비스 지원에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[D2-1] 대상자 선별·발굴 과정에서 광역의 안내와 지원이 충분하였습니까?');
  addAgreeScale(form, '[D2-2] 서비스 계획(개별·집단·치료지원) 수립 시 광역의 자문이 도움이 되었습니까?');
  addAgreeScale(form, '[D2-3] 어려운 사례 진행 중 광역의 슈퍼비전이 실질적으로 도움이 되었습니까?');
  addAgreeScale(form, '[D2-4] 외부 전문기관(치료·상담 등) 연계를 위한 광역의 정보 제공이 충분하였습니까?');
  addLongText(form, '[D2-5] 특화지원서비스 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J09 특화지원서비스');
  const mappings = getFieldIntroMappings('J09').concat([
    { title: '[공통-1] 광역지원기관이 특화지원서비스 운영 기준과 절차를 충분히 안내하였습니까?', code: '공통-1' },
    { title: '[공통-2] 지원이 필요할 때 광역 담당자에게 신속하게 연락하고 도움을 받을 수 있었습니까?', code: '공통-2' },
    { title: '[공통-3] 광역의 지원이 특화지원서비스 운영 역량 향상에 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 광역의 특화지원서비스 지원에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[D2-1] 대상자 선별·발굴 과정에서 광역의 안내와 지원이 충분하였습니까?', code: 'D2-1' },
    { title: '[D2-2] 서비스 계획(개별·집단·치료지원) 수립 시 광역의 자문이 도움이 되었습니까?', code: 'D2-2' },
    { title: '[D2-3] 어려운 사례 진행 중 광역의 슈퍼비전이 실질적으로 도움이 되었습니까?', code: 'D2-3' },
    { title: '[D2-4] 외부 전문기관(치료·상담 등) 연계를 위한 광역의 정보 제공이 충분하였습니까?', code: 'D2-4' },
    { title: '[D2-5] 특화지원서비스 관련 광역에 바라는 점을 적어주세요.', code: 'D2-5' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J09 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J10 퇴원환자 단기집중서비스 (10문항)
// ---------------------------------------------------------------------------
function createJ10Form() {
  const form = FormApp.create('J10 퇴원환자 단기집중서비스 현장설문');
  form.setDescription(
    '본 설문은 이번 퇴원환자 단기집중서비스 운영 지원에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 10문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J10', CONFIG.INITIAL_ROUNDS.J10);

  addSection(form, '이번 지원 평가',
    '다음 문항은 이번 퇴원환자 단기집중서비스 운영 지원에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 퇴원환자 서비스 진행 시 광역 담당자와 소통이 원활하였습니까?');
  addAgreeScale(form, '[공통-2] 광역이 제공한 실무 매뉴얼·가이드가 현장 운영의 지침이 되었습니까?');
  addAgreeScale(form, '[공통-3] 광역의 지원이 퇴원환자 서비스 운영 역량 향상에 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 퇴원환자 단기집중서비스 지원에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[D3-1] 광역의 슈퍼비전·사례 공유가 서비스 운영에 도움이 되었습니까?');
  addLongText(form, '[D3-2] 퇴원환자 단기집중서비스 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J10 퇴원환자 단기집중');
  const mappings = getFieldIntroMappings('J10').concat([
    { title: '[공통-1] 퇴원환자 서비스 진행 시 광역 담당자와 소통이 원활하였습니까?', code: '공통-1' },
    { title: '[공통-2] 광역이 제공한 실무 매뉴얼·가이드가 현장 운영의 지침이 되었습니까?', code: '공통-2' },
    { title: '[공통-3] 광역의 지원이 퇴원환자 서비스 운영 역량 향상에 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 퇴원환자 단기집중서비스 지원에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[D3-1] 광역의 슈퍼비전·사례 공유가 서비스 운영에 도움이 되었습니까?', code: 'D3-1' },
    { title: '[D3-2] 퇴원환자 단기집중서비스 관련 광역에 바라는 점을 적어주세요.', code: 'D3-2' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J10 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J11 노무 상담 지원 (11문항) — 중앙 노무사 초빙 집합교육만 대상
// ---------------------------------------------------------------------------
function createJ11Form() {
  const form = FormApp.create('J11 노무 상담 지원 현장설문 (집합교육)');
  form.setDescription(
    '본 설문은 이번 중앙 노무사 초빙 집합교육에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '※ 전화·시스템 입력 상담은 본 설문 대상에서 제외됩니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J11', CONFIG.INITIAL_ROUNDS.J11);

  addSection(form, '이번 교육 평가',
    '다음 문항은 이번 노무 상담 지원에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 노무 상담 요청 후 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?');
  addAgreeScale(form, '[공통-2] 노무 상담 내용이 실제 현장 노무 문제 상황에 맞게 제공되었습니까?');
  addAgreeScale(form, '[공통-3] 노무 상담이 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 노무 상담 지원에 대한 종합 만족도는 어느 정도입니까?');

  addSingleChoice(form,
    '[D4-1] 이번에 질의한 노무 유형은?',
    ['임금·수당 산정', '휴가·휴직 처리', '근로시간 관리',
     '징계·해고 절차', '폭언·폭행 피해의 산재·법적 절차 처리', '계약서·취업규칙'],
    true
  );
  addAgreeScale(form, '[D4-2] 노무 상담 후 해당 문제가 실질적으로 해결되었습니까?');
  addLongText(form, '[D4-3] 노무 상담 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J11 노무 상담 지원');
  const mappings = getFieldIntroMappings('J11').concat([
    { title: '[공통-1] 노무 상담 요청 후 광역 담당자의 응대가 신속하고 접근하기 용이하였습니까?', code: '공통-1' },
    { title: '[공통-2] 노무 상담 내용이 실제 현장 노무 문제 상황에 맞게 제공되었습니까?', code: '공통-2' },
    { title: '[공통-3] 노무 상담이 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 노무 상담 지원에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[D4-1] 이번에 질의한 노무 유형은?', code: 'D4-1' },
    { title: '[D4-2] 노무 상담 후 해당 문제가 실질적으로 해결되었습니까?', code: 'D4-2' },
    { title: '[D4-3] 노무 상담 관련 광역에 바라는 점을 적어주세요.', code: 'D4-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J11 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}
