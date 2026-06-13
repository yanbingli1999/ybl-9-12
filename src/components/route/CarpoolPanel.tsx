import { Users, Shield, Coins, Clock, Truck, UserPlus, AlertTriangle, Check } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { Caravan, CarpoolMode } from '../../../shared/types';
import { useMemo } from 'react';
import { filterCaravansForDestination, getDepartureDelay } from '../../utils/gameLogic';

interface CarpoolPanelProps {
  destinationId: string;
  routeType: 'land' | 'water' | null;
}

const CarpoolPanel = ({ destinationId, routeType }: CarpoolPanelProps) => {
  const {
    caravans,
    carpoolSelection,
    selectCarpoolMode,
    player,
  } = useGameStore();

  const availableCaravans = useMemo(() => {
    if (!destinationId || !routeType) return [];
    return filterCaravansForDestination(caravans, destinationId, routeType);
  }, [caravans, destinationId, routeType]);

  const modes: Array<{ mode: CarpoolMode; label: string; desc: string; icon: any }> = [
    { mode: 'solo', label: '独行', desc: '独自出发，灵活自由，无额外加成', icon: Truck },
    { mode: 'convoy', label: '并队', desc: '与其他商队同行，分摊路费，降低山贼风险', icon: Users },
    { mode: 'hitchhike', label: '搭顺风车', desc: '搭乘其他商队的运力，费用最低，但受载重限制', icon: UserPlus },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-amber-500" />
        商队合乘
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {modes.map(({ mode, label, desc, icon: Icon }) => {
          const isActive = carpoolSelection.mode === mode;
          const disabled = mode !== 'solo' && availableCaravans.length === 0;
          return (
            <button
              key={mode}
              onClick={() => {
                if (disabled) return;
                if (mode === 'solo') {
                  selectCarpoolMode('solo');
                } else {
                  selectCarpoolMode(mode, carpoolSelection.caravanId || availableCaravans[0]?.id);
                }
              }}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isActive
                  ? 'border-amber-500 bg-amber-50'
                  : disabled
                  ? 'border-slate-100 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                <span className={`font-medium text-sm ${isActive ? 'text-amber-700' : 'text-slate-700'}`}>
                  {label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </button>
          );
        })}
      </div>

      {carpoolSelection.mode !== 'solo' && (
        <div>
          <div className="text-sm text-slate-600 mb-3">
            当日前往该目的地的商队（{availableCaravans.length}）：
          </div>

          {availableCaravans.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
              今日暂无前往该目的地的{routeType === 'land' ? '陆路' : '水路'}商队
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {availableCaravans.map(caravan => (
                <CaravanCard
                  key={caravan.id}
                  caravan={caravan}
                  isSelected={carpoolSelection.caravanId === caravan.id}
                  currentTimeOfDay={player.timeOfDay}
                  mode={carpoolSelection.mode}
                  onSelect={() => selectCarpoolMode(carpoolSelection.mode, caravan.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {carpoolSelection.mode === 'solo' && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
          选择独行将直接派车，无需等待其他商队。
        </div>
      )}
    </div>
  );
};

interface CaravanCardProps {
  caravan: Caravan;
  isSelected: boolean;
  currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  mode: CarpoolMode;
  onSelect: () => void;
}

const CaravanCard = ({ caravan, isSelected, currentTimeOfDay, mode, onSelect }: CaravanCardProps) => {
  const delayInfo = getDepartureDelay(currentTimeOfDay, caravan.departureTimeOfDay);
  const costSharePercent = Math.round((1 - caravan.costShareRatio) * 100);
  const hitchhikePercent = Math.round(caravan.costShareRatio * 0.8 * 100);
  const riskReductionPercent = Math.round(caravan.banditRiskReduction * 100);

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{caravan.leaderName}</span>
            {isSelected && <Check className="w-4 h-4 text-amber-600" />}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {caravan.members.length + 1} 人同行 · {caravan.vehicleType === 'land' ? '陆路' : '水路'}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {caravan.departureLabel}
          </div>
          {delayInfo.hoursToWait > 0 && (
            <div className="text-xs text-amber-600 mt-0.5">
              需等 {delayInfo.hoursToWait} 小时
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-600">
            {mode === 'convoy' ? `节省约 ${costSharePercent}% 路费` : `仅需原价 ${hitchhikePercent}%`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          <span className="text-slate-600">山贼风险 ↓{riskReductionPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-slate-600">
            载重 {caravan.totalCargoWeight}/{caravan.capacity}
          </span>
        </div>
        {caravan.speedPenaltyWeight > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-orange-600">重货拖慢速度</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-2">
        <div className="text-xs text-slate-500 mb-1">同行成员：</div>
        <div className="flex flex-wrap gap-1.5">
          {caravan.members.map(member => (
            <span
              key={member.id}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
              title={`${member.description} · ${member.cargoWeight} 单位`}
            >
              {member.name}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};

export default CarpoolPanel;
