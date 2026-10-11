/**
 * Sample STM32Cube HAL Embedded C Programs
 * AI Recommends Energy-Efficient PWM Duty Cycle — STM32H7 + DC Motor
 */

export const SAMPLE_C_PROGRAM = `/**
 ******************************************************************************
 * @file           : main.c
 * @brief          : STM32H743ZI DC Motor PWM Controller with Current Telemetry
 * @project        : AI Recommends Energy-Efficient PWM Duty Cycle
 * @target         : STM32H743ZI (Arm Cortex-M7 @ 480 MHz)
 ******************************************************************************
 */

#include "stm32h7xx_hal.h"
#include <stdio.h>

/* PWM Timer & Electrical Constants */
#define PWM_TIMER_FREQ_HZ   20000      // 20 kHz Ultrasonic PWM (avoids audible whine)
#define PWM_TIMER_ARR       24000      // Auto-reload value (TIM1 @ 480MHz / Prescaler)
#define MOTOR_RATED_VOLTAGE 12.0f      // Nominal motor supply (V)

/* Hardware Peripherals */
TIM_HandleTypeDef htim1;               // Advanced Motor Control Timer 1
ADC_HandleTypeDef hadc1;               // High-speed 16-bit ADC 1
UART_HandleTypeDef huart3;             // ST-LINK VCP UART Telemetry

/* Operational Parameters (Parsed & Interpreted by Laboratory Engine) */
float duty_percent = 40.0f;            // Configured PWM Duty Cycle (0.0% to 100.0%)
float target_rpm   = 1000.0f;          // Target operating speed (RPM)
float max_current_limit = 3.50f;       // Armature current limit (A)

/* Private Function Prototypes */
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_TIM1_Init(void);
static void MX_ADC1_Init(void);
static void MX_USART3_UART_Init(void);
void SetPWMDutyCycle(float duty);
float ReadMotorCurrent_ADC(void);

/**
 * @brief Main execution entry point
 */
int main(void)
{
  /* Reset of all peripherals, initialize Flash and Systick */
  HAL_Init();
  SystemClock_Config();

  /* Initialize GPIO, TIM1 PWM, ADC1, and UART */
  MX_GPIO_Init();
  MX_TIM1_Init();
  MX_ADC1_Init();
  MX_USART3_UART_Init();

  printf("[SYSTEM] STM32H743ZI Cortex-M7 booted at 480 MHz\\r\\n");
  printf("[PWM] TIM1 Channel 1 mapped to Pin PA8\\r\\n");
  printf("[CONFIG] Initial Target Duty: %.1f%% | Target RPM: %.0f\\r\\n", duty_percent, target_rpm);

  /* Start PWM Generation on TIM1 Channel 1 (PA8) */
  HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);
  SetPWMDutyCycle(duty_percent);

  printf("[RUNNING] PWM Active. Entering real-time monitoring loop...\\r\\n");

  /* Main Control Loop */
  while (1)
  {
    /* 1. Sample Armature Current via ADC1 */
    float motor_current = ReadMotorCurrent_ADC();

    /* 2. Safety Over-Current Protection */
    if (motor_current > max_current_limit)
    {
      SetPWMDutyCycle(0.0f); // Emergency Gate Shutoff
      printf("[ALERT] Current limit exceeded! (%.2f A > %.2f A) PWM clamped.\\r\\n",
             motor_current, max_current_limit);
      HAL_Delay(500);
    }
    else
    {
      /* Apply configured PWM duty cycle to motor driver */
      SetPWMDutyCycle(duty_percent);
    }

    /* 3. Output Telemetry via Virtual UART */
    printf("[TELEMETRY] Duty: %.1f%% | Current: %.2f A\\r\\n", duty_percent, motor_current);

    HAL_Delay(100); // 10 Hz telemetry rate
  }
}

/**
 * @brief  Updates the TIM1 Compare Register for PWM Duty Cycle
 * @param  duty: Floating-point duty percentage (0.0 to 100.0)
 */
void SetPWMDutyCycle(float duty)
{
  if (duty < 0.0f)   duty = 0.0f;
  if (duty > 100.0f) duty = 100.0f;

  /* Calculate CCR pulse value proportional to Auto-Reload Register */
  uint32_t pulse = (uint32_t)((duty / 100.0f) * PWM_TIMER_ARR);
  __HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, pulse);
}

/**
 * @brief  Reads ACS712 current sensor output through ADC1 Channel 16
 * @retval Armature current in Amperes
 */
float ReadMotorCurrent_ADC(void)
{
  HAL_ADC_Start(&hadc1);
  if (HAL_ADC_PollForConversion(&hadc1, 10) == HAL_OK)
  {
    uint32_t raw_adc = HAL_ADC_GetValue(&hadc1);
    float adc_voltage = (raw_adc * 3.3f) / 65535.0f;
    // ACS712-05B: 1.65V zero point, 185 mV/A sensitivity
    float current = (adc_voltage - 1.65f) / 0.185f;
    return (current < 0.0f) ? 0.0f : current;
  }
  return 0.0f;
}

static void MX_TIM1_Init(void)
{
  TIM_OC_InitTypeDef sConfigOC = {0};
  htim1.Instance = TIM1;
  htim1.Init.Prescaler = 0;
  htim1.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim1.Init.Period = PWM_TIMER_ARR;
  htim1.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  HAL_TIM_PWM_Init(&htim1);

  sConfigOC.OCMode = TIM_OCMODE_PWM1;
  sConfigOC.Pulse = 0;
  sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
  HAL_TIM_PWM_ConfigChannel(&htim1, &sConfigOC, TIM_CHANNEL_1);
}

static void MX_ADC1_Init(void)
{
  hadc1.Instance = ADC1;
  hadc1.Init.Resolution = ADC_RESOLUTION_16B;
  HAL_ADC_Init(&hadc1);
}

static void MX_GPIO_Init(void)
{
  __HAL_RCC_GPIOA_CLK_ENABLE();
}

static void MX_USART3_UART_Init(void)
{
  huart3.Instance = USART3;
  huart3.Init.BaudRate = 115200;
  huart3.Init.WordLength = UART_WORDLENGTH_8B;
  HAL_UART_Init(&huart3);
}

void SystemClock_Config(void)
{
  // 480 MHz Core PLL configuration
}
`;

export const ALTERNATE_PROGRAMS = [
  {
    id: 'default',
    title: 'Standard Controller (40% Duty Cycle)',
    duty: 40.0,
    code: SAMPLE_C_PROGRAM
  },
  {
    id: 'eco_mode',
    title: 'Low-Power ECO Mode (25% Duty Cycle)',
    duty: 25.0,
    code: SAMPLE_C_PROGRAM.replace('float duty_percent = 40.0f;', 'float duty_percent = 25.0f;')
  },
  {
    id: 'high_torque',
    title: 'High Load / Fast Ramp Mode (65% Duty Cycle)',
    duty: 65.0,
    code: SAMPLE_C_PROGRAM.replace('float duty_percent = 40.0f;', 'float duty_percent = 65.0f;')
  }
];

