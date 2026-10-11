/**
 * Supported-setting parser for the STM32 HAL example. This does not compile C.
 * It extracts a small, documented subset used by the browser motor model.
 */

const NUMBER = '([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?)';

export function parseProgramConfiguration(cCode = '') {
  const issues = [];
  const extracted = {
    dutyPercent: 40,
    targetRpm: 1000,
    pwmFrequencyHz: 20000,
    maxCurrentLimit: 3.5,
    hasPwmStart: false,
    hasSetPwmFunction: false,
    hasCurrentSensorRead: false,
    hasUartTelemetry: false,
    syntaxValid: true,
    supportedPatterns: []
  };
  const lines = cCode.split('\n');
  const variablePattern = '(?:float|double|uint32_t|int)\\s+';
  const numericLiteral = `${NUMBER}\\s*f?`;

  const dutyMatch = cCode.match(new RegExp(`${variablePattern}(?:duty_percent|duty_cycle|pwm_duty)\\s*=\\s*${numericLiteral}\\s*;`, 'i'));
  let hasDutyConfiguration = Boolean(dutyMatch);
  if (dutyMatch) {
    const value = Number(dutyMatch[1]);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      issues.push({ type: 'error', code: 'ERR_DUTY_OUT_OF_RANGE', message: `Duty cycle ${dutyMatch[1]}% must be between 0% and 100%.`, line: findLineNumber(lines, dutyMatch[0]) });
      hasDutyConfiguration = false;
    } else {
      extracted.dutyPercent = value;
      extracted.supportedPatterns.push(`duty_percent = ${value.toFixed(1)}%`);
    }
  } else {
    const hasDutyName = /\b(?:duty_percent|duty_cycle|pwm_duty)\b/i.test(cCode);
    issues.push({
      type: 'error',
      code: 'ERR_UNSUPPORTED_DUTY_PATTERN',
      message: hasDutyName
        ? 'The duty-cycle variable exists, but it is not a supported numeric literal assignment.'
        : "No supported duty setting found. Add a declaration such as 'float duty_percent = 40.0f;'.",
      line: 1
    });
  }

  const targetMatch = cCode.match(new RegExp(`${variablePattern}target_rpm\\s*=\\s*${numericLiteral}\\s*;`, 'i'));
  if (targetMatch) {
    extracted.targetRpm = Number(targetMatch[1]);
    if (!Number.isFinite(extracted.targetRpm) || extracted.targetRpm <= 0 || extracted.targetRpm > 3500) {
      issues.push({ type: 'error', code: 'ERR_TARGET_RPM_OUT_OF_RANGE', message: 'target_rpm must be greater than 0 and no more than 3500 RPM.', line: findLineNumber(lines, targetMatch[0]) });
    } else {
      extracted.supportedPatterns.push(`target_rpm = ${extracted.targetRpm.toFixed(0)} RPM`);
    }
  }

  const currentMatch = cCode.match(new RegExp(`${variablePattern}max_current_limit\\s*=\\s*${numericLiteral}\\s*;`, 'i'));
  if (currentMatch) {
    extracted.maxCurrentLimit = Number(currentMatch[1]);
    if (!Number.isFinite(extracted.maxCurrentLimit) || extracted.maxCurrentLimit <= 0 || extracted.maxCurrentLimit > 100) {
      issues.push({ type: 'error', code: 'ERR_CURRENT_LIMIT_OUT_OF_RANGE', message: 'max_current_limit must be greater than 0 A and no more than 100 A.', line: findLineNumber(lines, currentMatch[0]) });
    } else {
      extracted.supportedPatterns.push(`max_current_limit = ${extracted.maxCurrentLimit.toFixed(2)} A`);
    }
  }

  const frequencyMatch = cCode.match(new RegExp(`#define\\s+PWM_TIMER_FREQ_HZ\\s+${NUMBER}`, 'i'));
  if (frequencyMatch) {
    extracted.pwmFrequencyHz = Number(frequencyMatch[1]);
    if (!Number.isFinite(extracted.pwmFrequencyHz) || extracted.pwmFrequencyHz < 100 || extracted.pwmFrequencyHz > 200000) {
      issues.push({ type: 'error', code: 'ERR_PWM_FREQUENCY_OUT_OF_RANGE', message: 'PWM_TIMER_FREQ_HZ must be between 100 Hz and 200 kHz.', line: findLineNumber(lines, frequencyMatch[0]) });
    } else {
      extracted.supportedPatterns.push(`PWM_TIMER_FREQ_HZ = ${extracted.pwmFrequencyHz} Hz`);
    }
  } else {
    issues.push({ type: 'warning', code: 'WARN_DEFAULT_PWM_FREQUENCY', message: 'PWM_TIMER_FREQ_HZ was not found; the model uses its documented 20 kHz default.', line: 1 });
  }

  extracted.hasPwmStart = /HAL_TIM_PWM_Start\s*\(/i.test(cCode);
  extracted.hasSetPwmFunction = /SetPWMDutyCycle\s*\(/i.test(cCode);
  extracted.hasCurrentSensorRead = /ReadMotorCurrent_ADC\s*\(/i.test(cCode) || /HAL_ADC_GetValue\s*\(/i.test(cCode);
  extracted.hasUartTelemetry = /HAL_UART_Transmit\s*\(/i.test(cCode) || /printf\s*\(/i.test(cCode);

  if (!extracted.hasPwmStart) issues.push({ type: 'warning', code: 'WARN_PWM_START_NOT_FOUND', message: "HAL_TIM_PWM_Start was not found; the browser model still uses the parsed duty setting.", line: 1 });
  if (!extracted.hasSetPwmFunction) issues.push({ type: 'warning', code: 'WARN_DUTY_FUNCTION_NOT_FOUND', message: 'SetPWMDutyCycle was not found; the browser model does not execute the C function.', line: 1 });

  const codeWithoutCommentsOrStrings = cCode
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
  let braceBalance = 0;
  for (const character of codeWithoutCommentsOrStrings) {
    if (character === '{') braceBalance += 1;
    if (character === '}') braceBalance -= 1;
    if (braceBalance < 0) break;
  }
  if (braceBalance !== 0) {
    issues.push({
      type: 'error',
      code: 'ERR_UNBALANCED_BRACES',
      message: `Brace check failed (${braceBalance > 0 ? `${braceBalance} unclosed` : `${Math.abs(braceBalance)} extra closing`}). This is a basic check, not a C compiler.`,
      line: lines.length
    });
    extracted.syntaxValid = false;
  }

  const hasErrors = issues.some(issue => issue.type === 'error');
  return {
    config: extracted,
    issues,
    isValid: extracted.syntaxValid && hasDutyConfiguration && !hasErrors,
    isSyntaxValid: extracted.syntaxValid,
    rawCode: cCode
  };
}

function findLineNumber(lines, snippet) {
  const lineIndex = lines.findIndex(line => line.includes(snippet));
  return lineIndex === -1 ? 1 : lineIndex + 1;
}

export function updateDutyCycleInCode(code, newDutyPercent) {
  const safeDuty = Math.min(100, Math.max(0, Number(newDutyPercent)));
  if (!Number.isFinite(safeDuty)) return code;
  const formatted = `${safeDuty.toFixed(1)}f`;
  const regex = /((?:float|double|uint32_t|int)\s+(?:duty_percent|duty_cycle|pwm_duty)\s*=\s*)([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?\s*f?)(\s*;)/i;
  return regex.test(code) ? code.replace(regex, `$1${formatted}$3`) : code;
}
