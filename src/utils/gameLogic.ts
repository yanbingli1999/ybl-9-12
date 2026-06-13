import type { 
  Commission, 
  Goods, 
  City, 
  Weather, 
  GameEvent,
  Player,
  PlayerVehicle,
  Warehouse,
  SaveGame,
  Trip,
  Caravan,
  CaravanMember,
  CarpoolMode,
  Route,
} from '../../shared/types';
import { calculateReputationGrade, calculateWarehouseCapacity, calculateWarehouseUpgradeCost } from './settlement';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getCurrentDate = (day: number): string => {
  const baseDate = new Date('2024-01-01');
  baseDate.setDate(baseDate.getDate() + day - 1);
  return `${baseDate.getFullYear()}年${baseDate.getMonth() + 1}月${baseDate.getDate()}日`;
};

export const generateRandomCommissions = (
  goodsList: Goods[],
  cities: City[],
  reputationGrade: string,
  count: number = 6
): Commission[] => {
  const commissions: Commission[] = [];
  const destinations = cities.filter(c => c.id !== 'yuegang');
  
  let qualityMultiplier = 1;
  if (reputationGrade === '甲') qualityMultiplier = 1.5;
  else if (reputationGrade === '乙') qualityMultiplier = 1.2;
  else if (reputationGrade === '丁') qualityMultiplier = 0.8;
  
  for (let i = 0; i < count; i++) {
    const goods = goodsList[Math.floor(Math.random() * goodsList.length)];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    
    const baseQuantity = Math.floor(Math.random() * 15) + 5;
    const quantity = Math.ceil(baseQuantity * qualityMultiplier);
    
    const baseReward = goods.basePrice * quantity;
    const rewardMultiplier = 1.2 + Math.random() * 0.6;
    const reward = Math.floor(baseReward * rewardMultiplier * qualityMultiplier);
    
    const deadlineBase = 12 + Math.floor(Math.random() * 36);
    const deadlineHours = Math.ceil(deadlineBase / qualityMultiplier);
    
    const isEmergency = Math.random() < 0.2;
    const finalReward = isEmergency ? Math.floor(reward * 1.5) : reward;
    const finalDeadline = isEmergency ? Math.ceil(deadlineHours * 0.7) : deadlineHours;
    
    commissions.push({
      id: generateId(),
      goodsId: goods.id,
      goodsName: goods.name,
      destinationId: destination.id,
      destinationName: destination.name,
      quantity,
      reward: finalReward,
      deadlineHours: finalDeadline,
      fragility: goods.fragility,
      isAccepted: false,
      createdAt: Date.now(),
    });
  }
  
  return commissions;
};

export const getRandomWeather = (weatherList: Weather[]): Weather => {
  const weights = [40, 25, 12, 5, 8, 4, 3, 3];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weatherList.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return weatherList[i];
    }
  }
  
  return weatherList[0];
};

export const getRandomEvents = (
  eventsList: GameEvent[],
  routeType: 'land' | 'water',
  count: number = 2,
  dangerRiskReduction: number = 0
): GameEvent[] => {
  const filteredEvents = eventsList.filter(e => {
    if (routeType === 'water' && e.id === 'bandit') return false;
    if (routeType === 'land' && e.id === 'pirate') return false;
    return true;
  });
  
  const selected: GameEvent[] = [];
  const shuffled = [...filteredEvents].sort(() => Math.random() - 0.5);
  
  for (const event of shuffled) {
    if (selected.length >= count) break;
    
    let probability = event.probability * 2;
    if (event.type === 'danger' && dangerRiskReduction > 0) {
      probability = probability * (1 - dangerRiskReduction);
    }
    
    if (Math.random() < probability) {
      selected.push(event);
    }
  }
  
  return selected;
};

export const createInitialPlayer = (): Player => {
  return {
    id: generateId(),
    name: '月港邮差',
    gold: 1000,
    reputation: 600,
    reputationGrade: '丙',
    priceBonus: 0,
    currentDay: 1,
    timeOfDay: 'morning',
  };
};

export const createInitialVehicles = (): PlayerVehicle[] => {
  return [
    {
      id: generateId(),
      vehicleId: 'donkey-cart',
      name: '驴车',
      type: 'land',
      capacity: 50,
      speed: 12,
      costPerHour: 5,
      icon: '🐴',
      isAvailable: true,
    },
    {
      id: generateId(),
      vehicleId: 'small-boat',
      name: '小渡船',
      type: 'water',
      capacity: 80,
      speed: 20,
      costPerHour: 15,
      icon: '⛵',
      isAvailable: true,
    },
  ];
};

export const createInitialWarehouse = (): Warehouse => {
  const level = 1;
  return {
    id: generateId(),
    level,
    capacity: calculateWarehouseCapacity(level),
    usedSpace: 0,
    upgradeCost: calculateWarehouseUpgradeCost(level),
  };
};

export const createInitialSaveGame = (): SaveGame => {
  const player = createInitialPlayer();
  const repInfo = calculateReputationGrade(player.reputation);
  player.reputationGrade = repInfo.grade;
  player.priceBonus = repInfo.priceBonus;
  
  return {
    player,
    commissions: [],
    trips: [],
    vehicles: createInitialVehicles(),
    warehouse: createInitialWarehouse(),
    ledger: [],
    currentWeatherId: 'sunny',
    savedAt: Date.now(),
  };
};

export const advanceTime = (player: Player): Player => {
  const timeOrder: Player['timeOfDay'][] = ['morning', 'afternoon', 'evening', 'night'];
  const currentIndex = timeOrder.indexOf(player.timeOfDay);
  
  let newTimeOfDay: Player['timeOfDay'];
  let newDay = player.currentDay;
  
  if (currentIndex === timeOrder.length - 1) {
    newTimeOfDay = 'morning';
    newDay += 1;
  } else {
    newTimeOfDay = timeOrder[currentIndex + 1];
  }
  
  return {
    ...player,
    timeOfDay: newTimeOfDay,
    currentDay: newDay,
  };
};

export const getTimeOfDayName = (timeOfDay: Player['timeOfDay']): string => {
  const names: Record<Player['timeOfDay'], string> = {
    morning: '清晨',
    afternoon: '午后',
    evening: '傍晚',
    night: '夜晚',
  };
  return names[timeOfDay];
};

export const canAcceptCommission = (
  commission: Commission,
  warehouse: Warehouse,
  goodsList: Goods[],
  acceptedCommissions: Commission[]
): { canAccept: boolean; reason?: string } => {
  const goods = goodsList.find(g => g.id === commission.goodsId);
  if (!goods) {
    return { canAccept: false, reason: '货物信息不存在' };
  }
  
  const newLoad = commission.quantity * goods.weight;
  const currentLoad = acceptedCommissions.reduce((total, c) => {
    const g = goodsList.find(good => good.id === c.goodsId);
    return total + (c.quantity * (g?.weight || 1));
  }, 0);
  
  if (currentLoad + newLoad > warehouse.capacity) {
    return { canAccept: false, reason: '仓库容量不足' };
  }
  
  return { canAccept: true };
};

export const calculateWarehouseUsedSpace = (
  commissions: Commission[],
  goodsList: Goods[],
  completedTrips: Trip[]
): number => {
  const activeCommissions = commissions.filter(c => c.isAccepted && !c.isCompleted);
  
  return activeCommissions.reduce((total, commission) => {
    const goods = goodsList.find(g => g.id === commission.goodsId);
    return total + (commission.quantity * (goods?.weight || 1));
  }, 0);
};

export const getTimeOfDayHours = (timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): number => {
  const hoursMap: Record<'morning' | 'afternoon' | 'evening' | 'night', number> = {
    morning: 6,
    afternoon: 12,
    evening: 18,
    night: 24,
  };
  return hoursMap[timeOfDay];
};

export const calculateTotalGameHours = (day: number, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): number => {
  return (day - 1) * 24 + getTimeOfDayHours(timeOfDay);
};

export const calculateIsLateGameTime = (
  acceptedGameHours: number,
  deadlineHours: number,
  departedGameHours: number,
  totalTripHours: number,
  extraDelay: number
): boolean => {
  const deadlineGameTime = acceptedGameHours + deadlineHours;
  const arrivalGameTime = departedGameHours + totalTripHours + extraDelay;
  return arrivalGameTime > deadlineGameTime;
};

const caravanLeaderNames = [
  '张记商行', '李掌柜车队', '王记镖局', '赵家马帮',
  '陈氏漕运', '刘家商队', '周家航船', '吴家镖局',
  '郑家商团', '杨家运输', '孙家车马行', '朱家船队',
];

const memberDescriptions = [
  '丝绸商人', '茶叶批发商', '瓷器货郎', '盐商代理',
  '药材贩子', '粮食商人', '布匹织户', '铁匠铺主',
  '皮货商人', '香料店主', '珠宝商队', '木材贩子',
];

const memberNames = [
  '老赵', '小钱', '老孙', '老李', '老周', '老吴',
  '老郑', '老王', '老冯', '老陈', '老褚', '老卫',
  '老蒋', '老沈', '老韩', '老杨', '老朱', '老秦',
];

const generateCaravanMembers = (count: number, avgWeight: number): CaravanMember[] => {
  const members: CaravanMember[] = [];
  for (let i = 0; i < count; i++) {
    members.push({
      id: generateId(),
      name: memberNames[Math.floor(Math.random() * memberNames.length)],
      cargoWeight: Math.floor(avgWeight * (0.6 + Math.random() * 0.8)),
      description: memberDescriptions[Math.floor(Math.random() * memberDescriptions.length)],
    });
  }
  return members;
};

export const generateDailyCaravans = (
  cities: City[],
  routes: Route[],
  day: number
): Caravan[] => {
  const caravans: Caravan[] = [];
  const destinations = cities.filter(c => c.id !== 'yuegang');
  const timeSlots: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
  const timeLabels: Record<'morning' | 'afternoon' | 'evening', string> = {
    morning: '清晨卯时',
    afternoon: '午后未时',
    evening: '傍晚酉时',
  };

  const caravanCount = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < caravanCount; i++) {
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const matchingRoutes = routes.filter(r =>
      (r.fromCityId === 'yuegang' && r.toCityId === destination.id) ||
      (r.fromCityId === destination.id && r.toCityId === 'yuegang')
    );

    if (matchingRoutes.length === 0) continue;

    const route = matchingRoutes[Math.floor(Math.random() * matchingRoutes.length)];
    const departureTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const memberCount = 1 + Math.floor(Math.random() * 3);
    const avgWeight = 20 + Math.floor(Math.random() * 40);
    const members = generateCaravanMembers(memberCount, avgWeight);
    const totalCargoWeight = members.reduce((sum, m) => sum + m.cargoWeight, 0);
    const capacity = totalCargoWeight + 30 + Math.floor(Math.random() * 50);
    const availableSeats = Math.max(0, capacity - totalCargoWeight);

    const memberFactor = 1 / (memberCount + 1);
    const costShareRatio = memberFactor * 0.9;
    const banditRiskReduction = Math.min(0.7, 0.15 + memberCount * 0.1);
    const heaviestMember = Math.max(...members.map(m => m.cargoWeight));
    const speedPenaltyWeight = heaviestMember > avgWeight * 1.5 ? heaviestMember * 0.15 : 0;

    caravans.push({
      id: generateId(),
      leaderName: caravanLeaderNames[(day + i) % caravanLeaderNames.length],
      routeId: route.id,
      destinationId: destination.id,
      destinationName: destination.name,
      departureTimeOfDay: departureTime,
      departureLabel: timeLabels[departureTime],
      vehicleType: route.type,
      members,
      totalCargoWeight,
      capacity,
      availableSeats,
      banditRiskReduction,
      costShareRatio,
      speedPenaltyWeight,
    });
  }

  return caravans;
};

export interface CarpoolCostResult {
  baseCost: number;
  sharedCost: number;
  savings: number;
  playerShare: number;
}

export const calculateCarpoolCost = (
  baseTripCost: number,
  mode: CarpoolMode,
  caravan?: Caravan
): CarpoolCostResult => {
  if (mode === 'solo' || !caravan) {
    return {
      baseCost: baseTripCost,
      sharedCost: baseTripCost,
      savings: 0,
      playerShare: baseTripCost,
    };
  }

  if (mode === 'convoy') {
    const sharedCost = Math.floor(baseTripCost * (1 - caravan.costShareRatio));
    return {
      baseCost: baseTripCost,
      sharedCost,
      savings: baseTripCost - sharedCost,
      playerShare: sharedCost,
    };
  }

  if (mode === 'hitchhike') {
    const sharedCost = Math.floor(baseTripCost * caravan.costShareRatio * 0.8);
    return {
      baseCost: baseTripCost,
      sharedCost,
      savings: baseTripCost - sharedCost,
      playerShare: sharedCost,
    };
  }

  return {
    baseCost: baseTripCost,
    sharedCost: baseTripCost,
    savings: 0,
    playerShare: baseTripCost,
  };
};

export interface CarpoolSpeedResult {
  baseTime: number;
  penaltyHours: number;
  finalTime: number;
  penaltyReason: string;
}

export const calculateCarpoolSpeed = (
  baseTimeHours: number,
  mode: CarpoolMode,
  caravan?: Caravan
): CarpoolSpeedResult => {
  if (mode === 'solo' || !caravan) {
    return {
      baseTime: baseTimeHours,
      penaltyHours: 0,
      finalTime: baseTimeHours,
      penaltyReason: '',
    };
  }

  if (caravan.speedPenaltyWeight > 0) {
    const penalty = Math.ceil(baseTimeHours * 0.15);
    return {
      baseTime: baseTimeHours,
      penaltyHours: penalty,
      finalTime: baseTimeHours + penalty,
      penaltyReason: `队友货物较重，队伍速度降低，增加 ${penalty} 小时`,
    };
  }

  if (mode === 'convoy') {
    const penalty = Math.ceil(baseTimeHours * 0.05);
    return {
      baseTime: baseTimeHours,
      penaltyHours: penalty,
      finalTime: baseTimeHours + penalty,
      penaltyReason: `并队同行需保持队形，略缓 ${penalty} 小时`,
    };
  }

  return {
    baseTime: baseTimeHours,
    penaltyHours: 0,
    finalTime: baseTimeHours,
    penaltyReason: '',
  };
};

export const filterCaravansForDestination = (
  caravans: Caravan[],
  destinationId: string,
  routeType: 'land' | 'water'
): Caravan[] => {
  return caravans.filter(c =>
    c.destinationId === destinationId &&
    c.vehicleType === routeType &&
    c.availableSeats > 0
  );
};

export const getDepartureDelay = (
  currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  caravanDeparture: 'morning' | 'afternoon' | 'evening'
): { delayed: boolean; hoursToWait: number; description: string } => {
  const timeOrder: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'afternoon', 'evening', 'night'];
  const timeHours: Record<'morning' | 'afternoon' | 'evening' | 'night', number> = {
    morning: 6,
    afternoon: 12,
    evening: 18,
    night: 24,
  };

  const currentIndex = timeOrder.indexOf(currentTimeOfDay);
  const targetIndex = timeOrder.indexOf(caravanDeparture);

  if (targetIndex >= currentIndex) {
    const hoursToWait = timeHours[caravanDeparture] - timeHours[currentTimeOfDay];
    if (hoursToWait === 0) {
      return { delayed: false, hoursToWait: 0, description: '即刻出发' };
    }
    return {
      delayed: true,
      hoursToWait,
      description: `需等待 ${hoursToWait} 小时，于${
        caravanDeparture === 'morning' ? '清晨' :
        caravanDeparture === 'afternoon' ? '午后' : '傍晚'
      }出发`,
    };
  }

  return {
    delayed: true,
    hoursToWait: 24 - timeHours[currentTimeOfDay] + timeHours[caravanDeparture],
    description: `今日班次已过，需等到次日${
      caravanDeparture === 'morning' ? '清晨' :
      caravanDeparture === 'afternoon' ? '午后' : '傍晚'
    }出发`,
  };
};
