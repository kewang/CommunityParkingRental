import { useTranslation } from "react-i18next";
import { ParkingSpace } from "@shared/schema";
import { STATUS_COLORS } from "@/types";

interface ParkingSpaceCardProps {
  space: ParkingSpace;
  licensePlate?: string;
}

const ParkingSpaceCard = ({ space, licensePlate }: ParkingSpaceCardProps) => {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[space.status];
  
  return (
    <div className="relative aspect-[4/3] bg-[#F3F2F1] rounded border border-[#605E5C]/20 flex flex-col items-center justify-center text-center p-1">
      <span className={`text-xs ${statusColor.bg} ${statusColor.text} px-1 rounded absolute top-1 right-1`}>
        {space.status === 'available' ? 'A' : space.status === 'occupied' ? 'O' : 'M'}
      </span>
      <div className="text-xs font-bold">{space.spaceNumber}</div>
      <div className="text-[10px]">
        {t(statusColor.label)}
      </div>
      {licensePlate && (
        <div className="text-[10px] bg-black/10 rounded px-1 mt-1">
          {licensePlate}
        </div>
      )}
    </div>
  );
};

export default ParkingSpaceCard;
