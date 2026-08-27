import { X, Trash2, Plus } from "lucide-react";
import { DailyPlan } from "../types/mirror.types";

type Props = {
  dailyPlans: DailyPlan[];

  time: string;
  title: string;

  onTimeChange: React.Dispatch<
    React.SetStateAction<string>
  >;

  onTitleChange: React.Dispatch<
    React.SetStateAction<string>
  >;

  onAdd: (
    event: React.FormEvent<HTMLFormElement>
  ) => Promise<void>;

  onRemove: (
    id: string
  ) => Promise<void>;

  onClose: () => void;
};

export default function DailyPlanModal({
  dailyPlans,
  time,
  title,
  onTimeChange,
  onTitleChange,
  onAdd,
  onRemove,
  onClose,
}: Props)  {

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
        >
          <X size={18}/>
        </button>

        <span className="modal-eyebrow">
          GÜNÜN PLANI
        </span>

        <h2>Planlarını Yönet</h2>

        <div className="plan-items-list">
          {dailyPlans.length > 0 ? (
            dailyPlans.map((plan) => (
              <div
                key={plan.id}
                className="plan-mgmt-item"
              >
                <div>
                  <b>{plan.time}</b>
                  <span>{plan.title}</span>
                </div>

                <button
                  type="button"
                  className="mgmt-delete-btn"
                  onClick={() => onRemove?.(plan.id)}
                >
                  <Trash2 size={15}/>
                </button>
              </div>
            ))
          ) : (
            <div className="wardrobe-mgmt-empty">
              <p>Henüz plan bulunmuyor.</p>
            </div>
          )}
        </div>

        <form
  className="plan-add-form"
  onSubmit={onAdd}
>
  <label>
    Saat
    <input
      type="time"
      value={time}
      onChange={(e) =>
        onTimeChange(e.target.value)
      }
      required
    />
  </label>

  <label>
    Plan adı
    <input
      value={title}
      onChange={(e) =>
        onTitleChange(e.target.value)
      }
      placeholder="Örn: Toplantı"
      required
    />
  </label>

  <button
    type="submit"
    className="modal-submit-btn"
    disabled={!title.trim()}
  >
    <Plus size={16}/>
    Plan Ekle
  </button>
</form>
      </div>
    </div>
  );
}