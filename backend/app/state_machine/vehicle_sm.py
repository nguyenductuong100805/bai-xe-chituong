from enum import Enum
from typing import Dict, Tuple

from app.models.enums import VehicleStatus


class VehicleTrigger(str, Enum):
    START_RENTAL = "START_RENTAL"                     # Rảnh -> Đang thuê
    SEND_TO_MAINTENANCE = "SEND_TO_MAINTENANCE"       # Rảnh -> Bảo trì
    RETURN_GOOD = "RETURN_GOOD"                       # Đang thuê -> Rảnh
    RETURN_NEED_MAINTENANCE = "RETURN_NEED_MAINTENANCE"  # Đang thuê -> Bảo trì
    FINISH_MAINTENANCE = "FINISH_MAINTENANCE"         # Bảo trì -> Rảnh


class InvalidStateTransitionError(ValueError):
    """Raised when a requested vehicle state transition violates the State Machine rules."""

    def __init__(self, current_state: VehicleStatus, trigger: VehicleTrigger):
        allowed = VehicleStateMachine.get_allowed_triggers(current_state)
        allowed_str = ", ".join(t.value for t in allowed) if allowed else "Không có"
        super().__init__(
            f"Chuyển trạng thái không hợp lệ: Xe đang ở trạng thái '{current_state.value}', "
            f"không thể thực hiện '{trigger.value}'. Các thao tác hợp lệ hiện tại: [{allowed_str}]."
        )
        self.current_state = current_state
        self.trigger = trigger


class VehicleStateMachine:
    """
    Finite State Machine (FSM) kiểm soát chặt chẽ vòng đời thực tế của xe:
      - Rảnh (AVAILABLE) -> Đang thuê (RENTED) [START_RENTAL]
      - Rảnh (AVAILABLE) -> Bảo trì (MAINTENANCE) [SEND_TO_MAINTENANCE]
      - Đang thuê (RENTED) -> Rảnh (AVAILABLE) [RETURN_GOOD]
      - Đang thuê (RENTED) -> Bảo trì (MAINTENANCE) [RETURN_NEED_MAINTENANCE]
      - Bảo trì (MAINTENANCE) -> Rảnh (AVAILABLE) [FINISH_MAINTENANCE]
    """

    TRANSITIONS: Dict[Tuple[VehicleStatus, VehicleTrigger], VehicleStatus] = {
        (VehicleStatus.AVAILABLE, VehicleTrigger.START_RENTAL): VehicleStatus.RENTED,
        (VehicleStatus.AVAILABLE, VehicleTrigger.SEND_TO_MAINTENANCE): VehicleStatus.MAINTENANCE,
        (VehicleStatus.RENTED, VehicleTrigger.RETURN_GOOD): VehicleStatus.AVAILABLE,
        (VehicleStatus.RENTED, VehicleTrigger.RETURN_NEED_MAINTENANCE): VehicleStatus.MAINTENANCE,
        (VehicleStatus.MAINTENANCE, VehicleTrigger.FINISH_MAINTENANCE): VehicleStatus.AVAILABLE,
    }

    @classmethod
    def can_transition(cls, current_state: VehicleStatus, trigger: VehicleTrigger) -> bool:
        return (current_state, trigger) in cls.TRANSITIONS

    @classmethod
    def get_allowed_triggers(cls, current_state: VehicleStatus) -> list[VehicleTrigger]:
        return [
            trigger
            for (state, trigger) in cls.TRANSITIONS.keys()
            if state == current_state
        ]

    @classmethod
    def transition(cls, current_state: VehicleStatus, trigger: VehicleTrigger) -> VehicleStatus:
        key = (current_state, trigger)
        if key not in cls.TRANSITIONS:
            raise InvalidStateTransitionError(current_state, trigger)
        return cls.TRANSITIONS[key]
