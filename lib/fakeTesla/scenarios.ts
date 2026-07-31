export interface ChargeCurvePoint {
  soc: number;
  kw: number;
}

export interface FakeScenario {
  id: string;
  label: string;
  acOrDc: "AC" | "DC";
  fastChargerType: string;
  fastChargerBrand: string;
  startSoc: number;
  targetSoc: number;
  /** power (kW) as a function of SOC (%), linearly interpolated between anchor points */
  curve: ChargeCurvePoint[];
  voltage: number;
  batteryCapacityKwh: number;
  /** miles — Tesla's API unit */
  startOdometer: number;
  outsideTempC: number;
  /** whether the pack was cold enough at plug-in that the heater runs for a while
   * after charging starts — see fakeGetVehicleData's battery_heater_on simulation. */
  batteryHeaterOnAtStart: boolean;
  /** how many simulated seconds pass per one real second (time compression for dev testing) */
  simulatedSecondsPerRealSecond: number;
  /** exercise the wake_up/408 code path for the first poll */
  injectAsleepAtStart?: boolean;
  /** exercise the 401 reconnect-prompt path after N polls */
  injectAuthErrorAfterPolls?: number;
  /** exercise the 429 backoff path after N polls */
  injectRateLimitAfterPolls?: number;
  /** simulate a cable disconnect before reaching targetSoc */
  interruptAfterSoc?: number;
}

export const FAKE_SCENARIOS: FakeScenario[] = [
  {
    id: "ac-home",
    label: "自宅 AC 普通充電 (34%→80%)",
    acOrDc: "AC",
    fastChargerType: "",
    fastChargerBrand: "",
    startSoc: 34,
    targetSoc: 80,
    curve: [
      { soc: 34, kw: 5.8 },
      { soc: 80, kw: 5.8 },
    ],
    voltage: 200,
    batteryCapacityKwh: 75,
    startOdometer: 12000,
    outsideTempC: 24,
    batteryHeaterOnAtStart: false,
    simulatedSecondsPerRealSecond: 60,
  },
  {
    id: "dc-fast",
    label: "急速充電 DC (15%→70%, テーパリングあり)",
    acOrDc: "DC",
    fastChargerType: "Combo1",
    fastChargerBrand: "Tesla",
    startSoc: 15,
    targetSoc: 70,
    curve: [
      { soc: 15, kw: 170 },
      { soc: 30, kw: 170 },
      { soc: 50, kw: 120 },
      { soc: 60, kw: 90 },
      { soc: 70, kw: 60 },
    ],
    voltage: 400,
    batteryCapacityKwh: 75,
    startOdometer: 24310,
    outsideTempC: 8,
    batteryHeaterOnAtStart: true,
    simulatedSecondsPerRealSecond: 60,
  },
  {
    id: "interrupted",
    label: "途中で切断されたセッション",
    acOrDc: "AC",
    fastChargerType: "",
    fastChargerBrand: "",
    startSoc: 40,
    targetSoc: 90,
    curve: [
      { soc: 40, kw: 7.4 },
      { soc: 90, kw: 7.4 },
    ],
    voltage: 200,
    batteryCapacityKwh: 75,
    startOdometer: 18500,
    outsideTempC: 18,
    batteryHeaterOnAtStart: false,
    simulatedSecondsPerRealSecond: 60,
    interruptAfterSoc: 55,
  },
  {
    id: "asleep-start",
    label: "スリープ車両からの起床 (wake_up経路)",
    acOrDc: "AC",
    fastChargerType: "",
    fastChargerBrand: "",
    startSoc: 50,
    targetSoc: 80,
    curve: [
      { soc: 50, kw: 5.8 },
      { soc: 80, kw: 5.8 },
    ],
    voltage: 200,
    batteryCapacityKwh: 75,
    startOdometer: 9800,
    outsideTempC: 20,
    batteryHeaterOnAtStart: false,
    simulatedSecondsPerRealSecond: 60,
    injectAsleepAtStart: true,
  },
  {
    id: "auth-error",
    label: "認証エラー (401) の発生",
    acOrDc: "AC",
    fastChargerType: "",
    fastChargerBrand: "",
    startSoc: 60,
    targetSoc: 90,
    curve: [
      { soc: 60, kw: 5.8 },
      { soc: 90, kw: 5.8 },
    ],
    voltage: 200,
    batteryCapacityKwh: 75,
    startOdometer: 5000,
    outsideTempC: 22,
    batteryHeaterOnAtStart: false,
    simulatedSecondsPerRealSecond: 60,
    injectAuthErrorAfterPolls: 3,
  },
  {
    id: "rate-limit",
    label: "レート制限 (429) の発生",
    acOrDc: "AC",
    fastChargerType: "",
    fastChargerBrand: "",
    startSoc: 45,
    targetSoc: 85,
    curve: [
      { soc: 45, kw: 5.8 },
      { soc: 85, kw: 5.8 },
    ],
    voltage: 200,
    batteryCapacityKwh: 75,
    startOdometer: 30250,
    outsideTempC: 15,
    batteryHeaterOnAtStart: false,
    simulatedSecondsPerRealSecond: 60,
    injectRateLimitAfterPolls: 5,
  },
];

export function getScenario(id: string | undefined): FakeScenario {
  return FAKE_SCENARIOS.find((s) => s.id === id) ?? FAKE_SCENARIOS[0];
}
