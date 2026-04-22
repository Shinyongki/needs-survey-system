/**
 * ============================================================================
 * j01_monitoring.gs — J01 수행기관 모니터링·점검 (13문항)
 * ----------------------------------------------------------------------------
 * 응답 대상: 전담사회복지사
 * 회차: 상·하반기 각 1회 (연 2회)
 * ============================================================================
 */

function createJ01Form() {
  const form = FormApp.create('J01 수행기관 모니터링·점검 현장설문');
  form.setDescription(
    '본 설문은 이번 수행기관 모니터링·점검에 대한 의견을 수렴하기 위한 것입니다.\n' +
    '응답은 개인별로 수집되며 분석 외 목적으로 사용되지 않습니다.\n' +
    '총 13문항으로 구성되어 있습니다.'
  );
  form.setProgressBar(true);

  // 도입부 4문항
  addFieldSurveyIntro(form, 'J01', CONFIG.INITIAL_ROUNDS.J01);

  // 본섹션 안내
  addSection(form, '이번 점검 평가',
    '다음 문항은 이번 점검에 관한 내용입니다.');

  // 공통-1·2·3·4
  addAgreeScale(form, '[공통-1] 점검 전 점검 항목·기준 안내가 충분하였습니까?');
  addAgreeScale(form, '[공통-2] 점검 과정에서 광역 담당자가 현장 상황을 충분히 파악하였습니까?');
  addAgreeScale(form, '[공통-3] 기관 운영 개선에 실질적으로 도움이 되었습니까?');
  addSatisfyScale(form, '[공통-4] 점검에 대한 종합 만족도는 어느 정도입니까?');

  // 특화 5문항
  addAgreeScale(form, '[A-1] 점검 항목이 현장 운영 실태를 반영하였습니까?');
  addAgreeScale(form, '[A-2] 광역 담당자의 현장 피드백이 구체적이고 도움이 되었습니까?');
  addAgreeScale(form, '[A-3] 점검 지적사항에 대해 스스로 개선 방향을 파악할 수 있었습니까?');
  addAgreeScale(form, '[A-4] 점검 방식(현장 방문·서면·화상)이 기관 상황에 적합하였습니까?');
  addLongText(form, '[A-5] 모니터링·점검 관련 광역에 바라는 점을 적어주세요.');

  // 스프레드시트 연결 및 헤더 매핑
  const ss = attachSpreadsheet(form, '[응답] J01 모니터링·점검');
  const mappings = getFieldIntroMappings('J01').concat([
    { title: '[공통-1] 점검 전 점검 항목·기준 안내가 충분하였습니까?', code: '공통-1' },
    { title: '[공통-2] 점검 과정에서 광역 담당자가 현장 상황을 충분히 파악하였습니까?', code: '공통-2' },
    { title: '[공통-3] 기관 운영 개선에 실질적으로 도움이 되었습니까?', code: '공통-3' },
    { title: '[공통-4] 점검에 대한 종합 만족도는 어느 정도입니까?', code: '공통-4' },
    { title: '[A-1] 점검 항목이 현장 운영 실태를 반영하였습니까?', code: 'A-1' },
    { title: '[A-2] 광역 담당자의 현장 피드백이 구체적이고 도움이 되었습니까?', code: 'A-2' },
    { title: '[A-3] 점검 지적사항에 대해 스스로 개선 방향을 파악할 수 있었습니까?', code: 'A-3' },
    { title: '[A-4] 점검 방식(현장 방문·서면·화상)이 기관 상황에 적합하였습니까?', code: 'A-4' },
    { title: '[A-5] 모니터링·점검 관련 광역에 바라는 점을 적어주세요.', code: 'A-5' }
  ]);
  createHeaderMapping(ss, mappings);

  Logger.log('J01 생성 완료: ' + form.getEditUrl());
  return { form: form, ss: ss };
}
