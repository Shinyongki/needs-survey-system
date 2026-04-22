/**
 * ============================================================================
 * main.gs — 전체 실행 컨트롤러
 * ----------------------------------------------------------------------------
 * 17종 구글폼(통합 2 + 현장 15) 일괄 생성 및 관리
 *
 * 실행 순서:
 *   1. config.gs 기관 목록 확인 (59개)
 *   2. Apps Script 편집기에서 createAllForms() 실행
 *   3. 실행 로그에서 생성된 폼 URL 확인
 *   4. 마스터 로그 스프레드시트에서 전체 목록 확인
 *   5. 수행기관에 배포
 *   6. 회차 진행 시 addRoundToForm(formId, label) 호출
 * ============================================================================
 */

/**
 * 전체 17종 구글폼 일괄 생성
 * ※ 주의: 실행 시간 약 2~4분 소요 (Apps Script 6분 제한 내 완료)
 * ※ 중도 실패 시 createSingleForm(code)로 개별 재시도 가능
 */
function createAllForms() {
  const createdForms = {};
  const errors = [];

  const tasks = [
    // 통합설문
    { code: 'S01', fn: createS01Form },
    { code: 'S02', fn: createS02Form },
    // 현장설문 (회차 있음)
    { code: 'J01', fn: createJ01Form },
    { code: 'J03', fn: createJ03Form },
    { code: 'J04', fn: createJ04Form },
    { code: 'J05', fn: createJ05Form },
    { code: 'J06', fn: createJ06Form },
    { code: 'J07', fn: createJ07Form },
    { code: 'J08', fn: createJ08Form },
    { code: 'J09', fn: createJ09Form },
    { code: 'J10', fn: createJ10Form },
    { code: 'J11', fn: createJ11Form },
    { code: 'J12', fn: createJ12Form },
    { code: 'J13', fn: createJ13Form },
    { code: 'J14', fn: createJ14Form },
    // 현장설문 (회차 없음)
    { code: 'J16', fn: createJ16Form },
    { code: 'J17', fn: createJ17Form }
  ];

  tasks.forEach(task => {
    try {
      Logger.log('========== ' + task.code + ' 생성 시작 ==========');
      createdForms[task.code] = task.fn();
      Logger.log('========== ' + task.code + ' 생성 완료 ==========');
    } catch (e) {
      Logger.log('!!! ' + task.code + ' 생성 실패: ' + e.toString());
      errors.push({ code: task.code, error: e.toString() });
    }
  });

  // 마스터 로그 생성
  let masterSs = null;
  if (Object.keys(createdForms).length > 0) {
    masterSs = logToMaster(createdForms);
  }

  // 요약 로그
  Logger.log('\n\n====================================');
  Logger.log('생성 완료: ' + Object.keys(createdForms).length + '종');
  Logger.log('생성 실패: ' + errors.length + '종');
  if (errors.length > 0) {
    Logger.log('실패 목록:');
    errors.forEach(e => Logger.log('  - ' + e.code + ': ' + e.error));
  }
  if (masterSs) {
    Logger.log('마스터 로그: ' + masterSs.getUrl());
  }
  Logger.log('====================================');

  return { created: createdForms, errors: errors, master: masterSs };
}

/**
 * 단일 폼만 생성 (재시도·개별 수정 용도)
 * @param {string} code - 'S01', 'S02', 'J01', ..., 'J17'
 * @returns {{form, ss}}
 */
function createSingleForm(code) {
  const map = {
    'S01': createS01Form, 'S02': createS02Form,
    'J01': createJ01Form, 'J03': createJ03Form, 'J04': createJ04Form,
    'J05': createJ05Form, 'J06': createJ06Form, 'J07': createJ07Form,
    'J08': createJ08Form, 'J09': createJ09Form, 'J10': createJ10Form,
    'J11': createJ11Form, 'J12': createJ12Form, 'J13': createJ13Form,
    'J14': createJ14Form, 'J16': createJ16Form, 'J17': createJ17Form
  };
  const fn = map[code];
  if (!fn) throw new Error('알 수 없는 코드: ' + code);
  return fn();
}

/**
 * 통합설문만 생성 (S01 + S02)
 * 상·하반기 시행 전 별도 배포 시 사용
 */
function createIntegratedOnly() {
  const created = {
    S01: createS01Form(),
    S02: createS02Form()
  };
  logToMaster(created);
  return created;
}

/**
 * 현장설문만 생성 (J01 + J03~J14 + J16·J17)
 * 연초 한번에 15종 일괄 생성 시 사용
 */
function createFieldOnly() {
  const created = {
    J01: createJ01Form(),
    J03: createJ03Form(), J04: createJ04Form(),
    J05: createJ05Form(), J06: createJ06Form(),
    J07: createJ07Form(), J08: createJ08Form(),
    J09: createJ09Form(), J10: createJ10Form(),
    J11: createJ11Form(), J12: createJ12Form(),
    J13: createJ13Form(), J14: createJ14Form(),
    J16: createJ16Form(), J17: createJ17Form()
  };
  logToMaster(created);
  return created;
}
