/**
 * ============================================================================
 * j03_j06_education.gs — 교육 관련 현장설문 4종
 * ----------------------------------------------------------------------------
 *  J03 역량강화교육 — 전담사회복지사 (11문항)
 *  J04 역량강화교육 — 생활지원사 (12문항, 욕구 문항 포함)
 *  J05 심리지원교육 — 전담사회복지사 (12문항)
 *  J06 심리지원교육 — 생활지원사 (13문항, 욕구 문항 포함)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// J03 역량강화교육 — 전담사회복지사 (11문항)
// ---------------------------------------------------------------------------
function createJ03Form() {
  const form = FormApp.create('J03 역량강화교육 (전담사회복지사) 현장설문');
  form.setDescription(
    '본 설문은 이번 역량강화교육에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 11문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J03', CONFIG.INITIAL_ROUNDS.J03);

  addSection(form, '이번 교육 평가',
    '다음 문항은 이번 역량강화교육에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 교육 주제가 현장 업무 역량 강화에 필요한 내용으로 구성되었습니까?');
  addAgreeScale(form, '[공통-2] 강사의 전문성과 강의 전달 방식이 교육 내용 이해에 적절하였습니까?');
  addAgreeScale(form, '[공통-3] 교육이 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[B1-1] 교육 운영 방식(집합·온라인 등)이 참여하기 편리하였습니까?');
  addAgreeScale(form, '[B1-2] 배운 내용을 현장에 적용할 수 있겠습니까?');
  addLongText(form, '[B1-3] 교육 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J03 역량강화교육 전담');
  const mappings = getFieldIntroMappings('J03').concat([
    { title: '[공통-1] 교육 주제가 현장 업무 역량 강화에 필요한 내용으로 구성되었습니까?', code: '공통-1' },
    { title: '[공통-2] 강사의 전문성과 강의 전달 방식이 교육 내용 이해에 적절하였습니까?', code: '공통-2' },
    { title: '[공통-3] 교육이 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[B1-1] 교육 운영 방식(집합·온라인 등)이 참여하기 편리하였습니까?', code: 'B1-1' },
    { title: '[B1-2] 배운 내용을 현장에 적용할 수 있겠습니까?', code: 'B1-2' },
    { title: '[B1-3] 교육 관련 광역에 바라는 점을 적어주세요.', code: 'B1-3' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J03 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J04 역량강화교육 — 생활지원사 (12문항, 욕구 문항 포함)
// ---------------------------------------------------------------------------
function createJ04Form() {
  const form = FormApp.create('J04 역량강화교육 (생활지원사) 현장설문');
  form.setDescription(
    '본 설문은 이번 역량강화교육에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 생활지원사 대상으로 개인별 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 12문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J04', CONFIG.INITIAL_ROUNDS.J04);

  addSection(form, '이번 교육 평가',
    '다음 문항은 이번 역량강화교육에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 교육 주제가 돌봄 현장 업무 역량 강화에 필요한 내용으로 구성되었습니까?');
  addAgreeScale(form, '[공통-2] 강사의 전문성과 강의 전달 방식이 교육 내용 이해에 적절하였습니까?');
  addAgreeScale(form, '[공통-3] 교육이 돌봄 업무에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[B2-1] 교육 운영 방식이 참여하기 편리하였습니까?');
  addAgreeScale(form, '[B2-2] 배운 내용을 현장에 적용할 수 있겠습니까?');
  addSingleChoice(form,
    '[B2-3] 다음 교육에서 가장 필요한 주제는?',
    ['이용자 안전사고 대응', '서비스 제공 실무', '감정노동·폭언 대처',
     '정보통신기기 활용', '치매·노인 질환 이해'],
    true
  );
  addLongText(form, '[B2-4] 교육 관련 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J04 역량강화교육 생활지원사');
  const mappings = getFieldIntroMappings('J04').concat([
    { title: '[공통-1] 교육 주제가 돌봄 현장 업무 역량 강화에 필요한 내용으로 구성되었습니까?', code: '공통-1' },
    { title: '[공통-2] 강사의 전문성과 강의 전달 방식이 교육 내용 이해에 적절하였습니까?', code: '공통-2' },
    { title: '[공통-3] 교육이 돌봄 업무에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[B2-1] 교육 운영 방식이 참여하기 편리하였습니까?', code: 'B2-1' },
    { title: '[B2-2] 배운 내용을 현장에 적용할 수 있겠습니까?', code: 'B2-2' },
    { title: '[B2-3] 다음 교육에서 가장 필요한 주제는?', code: 'B2-3' },
    { title: '[B2-4] 교육 관련 바라는 점을 적어주세요.', code: 'B2-4' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J04 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J05 심리지원교육 — 전담사회복지사 (12문항)
// ---------------------------------------------------------------------------
function createJ05Form() {
  const form = FormApp.create('J05 심리지원교육 (전담사회복지사) 현장설문');
  form.setDescription(
    '본 설문은 이번 심리지원교육에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 12문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J05', CONFIG.INITIAL_ROUNDS.J05);

  addSection(form, '이번 교육 평가',
    '다음 문항은 이번 심리지원교육에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 교육 주제가 소진 예방·심리 회복에 필요한 내용으로 구성되었습니까?');
  addAgreeScale(form, '[공통-2] 강사(진행자)의 전문성과 진행 방식이 심리적으로 안전하게 참여하기에 적절하였습니까?');
  addAgreeScale(form, '[공통-3] 교육이 소진 회복에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[B3-1] 프로그램 운영 방식이 참여하기 편리하였습니까?');
  addAgreeScale(form, '[B3-2] 프로그램이 감정노동·스트레스 관리에 도움이 되었습니까?');
  addAgreeScale(form, '[B3-3] 교육 참여 후 심리적 부담감이 완화되었습니까?');
  addLongText(form, '[B3-4] 심리지원교육 관련 광역에 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J05 심리지원교육 전담');
  const mappings = getFieldIntroMappings('J05').concat([
    { title: '[공통-1] 교육 주제가 소진 예방·심리 회복에 필요한 내용으로 구성되었습니까?', code: '공통-1' },
    { title: '[공통-2] 강사(진행자)의 전문성과 진행 방식이 심리적으로 안전하게 참여하기에 적절하였습니까?', code: '공통-2' },
    { title: '[공통-3] 교육이 소진 회복에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[B3-1] 프로그램 운영 방식이 참여하기 편리하였습니까?', code: 'B3-1' },
    { title: '[B3-2] 프로그램이 감정노동·스트레스 관리에 도움이 되었습니까?', code: 'B3-2' },
    { title: '[B3-3] 교육 참여 후 심리적 부담감이 완화되었습니까?', code: 'B3-3' },
    { title: '[B3-4] 심리지원교육 관련 광역에 바라는 점을 적어주세요.', code: 'B3-4' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J05 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}

// ---------------------------------------------------------------------------
// J06 심리지원교육 — 생활지원사 (13문항, 욕구 문항 포함)
// ---------------------------------------------------------------------------
function createJ06Form() {
  const form = FormApp.create('J06 심리지원교육 (생활지원사) 현장설문');
  form.setDescription(
    '본 설문은 이번 심리지원교육에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 생활지원사 대상으로 개인별 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 13문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  addFieldSurveyIntro(form, 'J06', CONFIG.INITIAL_ROUNDS.J06);

  addSection(form, '이번 교육 평가',
    '다음 문항은 이번 심리지원교육에 관한 내용입니다.');

  addAgreeScale(form, '[공통-1] 교육 주제가 소진 예방·심리 회복에 필요한 내용으로 구성되었습니까?');
  addAgreeScale(form, '[공통-2] 강사(진행자)의 전문성과 진행 방식이 심리적으로 안전하게 참여하기에 적절하였습니까?');
  addAgreeScale(form, '[공통-3] 교육이 소진 회복에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?');

  addAgreeScale(form, '[B4-1] 프로그램 운영 방식이 참여하기 편리하였습니까?');
  addAgreeScale(form, '[B4-2] 프로그램이 감정노동·스트레스 관리에 도움이 되었습니까?');
  addAgreeScale(form, '[B4-3] 교육 참여 후 심리적 부담감이 완화되었습니까?');
  addSingleChoice(form,
    '[B4-4] 다음 심리지원 프로그램에서 가장 필요한 것은?',
    ['소진 예방 및 자기돌봄', '감정노동 대처 기술', '동료 지지 모임',
     '전문 심리상담 연계', '여가·힐링 프로그램'],
    true
  );
  addLongText(form, '[B4-5] 심리지원교육 관련 바라는 점을 적어주세요.');

  const ss = attachSpreadsheet(form, '[응답] J06 심리지원교육 생활지원사');
  const mappings = getFieldIntroMappings('J06').concat([
    { title: '[공통-1] 교육 주제가 소진 예방·심리 회복에 필요한 내용으로 구성되었습니까?', code: '공통-1' },
    { title: '[공통-2] 강사(진행자)의 전문성과 진행 방식이 심리적으로 안전하게 참여하기에 적절하였습니까?', code: '공통-2' },
    { title: '[공통-3] 교육이 소진 회복에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 교육에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[B4-1] 프로그램 운영 방식이 참여하기 편리하였습니까?', code: 'B4-1' },
    { title: '[B4-2] 프로그램이 감정노동·스트레스 관리에 도움이 되었습니까?', code: 'B4-2' },
    { title: '[B4-3] 교육 참여 후 심리적 부담감이 완화되었습니까?', code: 'B4-3' },
    { title: '[B4-4] 다음 심리지원 프로그램에서 가장 필요한 것은?', code: 'B4-4' },
    { title: '[B4-5] 심리지원교육 관련 바라는 점을 적어주세요.', code: 'B4-5' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J06 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}
