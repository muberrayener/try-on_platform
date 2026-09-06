import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client";
import AccessoryModal from "./components/AccessoryModal";
import DailyPlanModal from "./components/DailyPlanModal";
import { LipstickModal } from "./components/LipstickModal"; // <-- LipstickModal import edildi
import { AccessoryItem, DailyPlan, ImageItem, MirrorView, User } from "./types/mirror.types";
import { MirrorHeader } from "./components/MirrorHeader";
import { MirrorLeftColumn } from "./components/MirrorLeftColumn";
import { MirrorStage } from "./components/MirrorStage";
import { WardrobePanel } from "./components/WardrobePanel";
import { WardrobeManagementModal } from "./components/WardrobeManagementModal";
import { MirrorToast } from "./components/common/MirrorToast";
import { useClock } from "./hooks/useClock";
import { useWeather } from "./hooks/useWeather";
import { usePersonImages } from "./hooks/usePersonImages";
import { useGarments } from "./hooks/useGarments";
import { normalizeAccessory, useAccessories } from "./hooks/useAccessories";
import { useDailyPlans } from "./hooks/useDailyPlans";
import { useJobs } from "./hooks/useJobs";
import { usePersonUpload } from "./hooks/usePersonUpload";
import { useToast } from "./hooks/useToast";
import { useTryOn } from "./hooks/useTryOn";
import { useLipsticks } from "./hooks/useLipsticks"; 

export default function MirrorDashboard({ user }: { user: User }) {
  const personInput = useRef<HTMLInputElement>(null);

  const [person, setPerson] = useState<File>();
  const [selectedGarment, setSelectedGarment] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [accessoryOpen, setAccessoryOpen] = useState(false);
  const [lipstickOpen, setLipstickOpen] = useState(false); // <-- Lipstick modal görünürlük state'i
  const [accessoryTab, setAccessoryTab] = useState<"list" | "add">("list");
  const [accessoryName, setAccessoryName] = useState("Yeni aksesuar");
  const [accessoryCategory, setAccessoryCategory] = useState("other");
  const [accessoryFile, setAccessoryFile] = useState<File>();
  const [accessoryPreviewUrl, setAccessoryPreviewUrl] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [planTime, setPlanTime] = useState("09:00");
  const [planTitle, setPlanTitle] = useState("");
  const [selectedShade, setSelectedShade] = useState("3");
  const [appliedShade, setAppliedShade] = useState<string | null>(null);
  const [mirrorView, setMirrorView] = useState<MirrorView>("base");

  const { error: uiError, success: uiSuccess, showError, showSuccess } = useToast();
  const { formattedTime, formattedDate } = useClock();
  const weather = useWeather();
  const images = usePersonImages();
  const { garments, addGarment, deleteGarment } = useGarments();
  const { accessories, addAccessory, removeAccessory } = useAccessories();
  const { dailyPlans, addDailyPlan, removeDailyPlan } = useDailyPlans();
  const { lipsticks, fetchLipsticks } = useLipsticks(); // <-- Lipstick hook kullanımı
  const jobs = useJobs();

  const readyImages = useMemo(
    () => [...(images.data ?? [])]
      .filter((image) => image.status === "ready" && image.background_removed && image.has_preview)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [images.data]
  );

  const visibleGarments = useMemo(() => (garments.data ?? []).filter((garment) => !!garment.image_url), [garments.data]);
  const recommendedGarments = useMemo(() => {
    const shuffled = [...visibleGarments];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, 3);
  }, [visibleGarments]);
  const accessoryItems = useMemo(() => (accessories.data ?? []).map(normalizeAccessory), [accessories.data]);
  const basePersonImage = readyImages[0];
  const processingImage = images.data?.find((image) => image.status === "uploaded" || image.status === "background_removal");
  const activeJob = jobs.data?.[0];
  const createTryOn = useTryOn(basePersonImage);

  // Seçili olan ruju otomatik algılayıp appliedShade state'ine yansıtma
  const selectedLipstick = useMemo(() => lipsticks.find((l) => l.is_selected), [lipsticks]);
  const recommendedLipsticks = useMemo(() => {
    const shuffled = [...lipsticks];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    const recommendations = shuffled.slice(0, 6);
    if (selectedLipstick && !recommendations.some((lipstick) => lipstick.id === selectedLipstick.id)) {
      recommendations[recommendations.length - 1] = selectedLipstick;
    }

    return recommendations;
  }, [lipsticks, selectedLipstick]);

  useEffect(() => {
    if (selectedLipstick) {
      setAppliedShade(selectedLipstick.color);
    }
  }, [selectedLipstick]);

  useEffect(() => {
    if (!visibleGarments.length) {
      setSelectedGarment("");
      return;
    }
    if (!selectedGarment || !recommendedGarments.some((garment) => garment.id === selectedGarment)) {
      setSelectedGarment(recommendedGarments[0].id);
    }
  }, [recommendedGarments, selectedGarment]);

  useEffect(() => {
    if (activeJob?.status === "completed" && activeJob.has_result) setMirrorView("result");
  }, [activeJob?.id, activeJob?.status, activeJob?.has_result]);

  useEffect(() => () => {
    if (accessoryPreviewUrl) URL.revokeObjectURL(accessoryPreviewUrl);
  }, [accessoryPreviewUrl]);

  const { uploadPerson } = usePersonUpload({ inputRef: personInput, showSuccess, showError });

  async function handlePersonUpload(event: FormEvent<HTMLFormElement>) {
    const ok = await uploadPerson(event, person);
    if (ok) setPerson(undefined);
  }

  async function handleAddGarment(data: { name: string; category: string; file: File }) {
    const form = new FormData();
    form.append("name", data.name);
    form.append("category", data.category);
    form.append("image", data.file);
    try {
      await addGarment.mutateAsync(form);
      showSuccess("Yeni kıyafet gardıroba eklendi.");
      return true;
    } catch {
      showError("Kıyafet eklenemedi.");
      return false;
    }
  }

  async function handleDeleteGarment(id: string) {
    try {
      await deleteGarment.mutateAsync(id);
      if (selectedGarment === id) setSelectedGarment("");
      showSuccess("Kıyafet gardıroptan kaldırıldı.");
    } catch {
      showError("Kıyafet silinemedi.");
    }
  }

  async function handleAddAccessory() {
    if (!accessoryFile) {
      showError("Aksesuar görseli seçmeden eklenemez.");
      return;
    }
    const form = new FormData();
    form.append("name", accessoryName.trim() || "Yeni aksesuar");
    form.append("category", accessoryCategory);
    form.append("image", accessoryFile);
    try {
      await addAccessory.mutateAsync(form);
      setAccessoryName("Yeni aksesuar");
      setAccessoryCategory("other");
      setAccessoryFile(undefined);
      if (accessoryPreviewUrl) URL.revokeObjectURL(accessoryPreviewUrl);
      setAccessoryPreviewUrl(null);
      showSuccess("Aksesuar eklendi.");
    } catch {
      showError("Aksesuar eklenemedi.");
    }
  }

  async function handleRemoveAccessory(id: string) {
    try {
      await removeAccessory.mutateAsync(id);
      showSuccess("Aksesuar kaldırıldı.");
    } catch {
      showError("Aksesuar silinemedi.");
    }
  }

  async function handleAddDailyPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await addDailyPlan.mutateAsync({ time: planTime, title: planTitle.trim() });
      setPlanTitle("");
      showSuccess("Günün planına eklendi.");
    } catch {
      showError("Plan eklenemedi.");
    }
  }

  async function handleRemoveDailyPlan(id: string) {
    try {
      await removeDailyPlan.mutateAsync(id);
      showSuccess("Plan kaldırıldı.");
    } catch {
      showError("Plan kaldırılamadı.");
    }
  }

  async function handleTryOn() {
    if (!basePersonImage || !selectedGarment) return;
    setMirrorView("base");
    try {
      await createTryOn.mutateAsync(selectedGarment);
    } catch {
      showError("Try-on işlemi başlatılamadı.");
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
      window.location.reload();
    } catch {
      showError("Çıkış yapılamadı.");
    }
  }

  function handleAccessoryFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (accessoryPreviewUrl) URL.revokeObjectURL(accessoryPreviewUrl);
    setAccessoryFile(nextFile);
    setAccessoryPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  function resetAccessoryAddForm() {
    setAccessoryName("Yeni aksesuar");
    setAccessoryCategory("other");
    setAccessoryFile(undefined);
    if (accessoryPreviewUrl) URL.revokeObjectURL(accessoryPreviewUrl);
    setAccessoryPreviewUrl(null);
  }

  return (
    <main className="mirror-room">
      <div className="room-backdrop" />
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-bottom" />

      <section className="smart-mirror">
        <div className="mirror-led-border" />

        <MirrorHeader
          user={user}
          weather={weather}
          formattedTime={formattedTime}
          formattedDate={formattedDate}
          profileOpen={profileOpen}
          onToggleProfile={() => setProfileOpen((value) => !value)}
          onUploadPerson={() => { personInput.current?.click(); setProfileOpen(false); }}
          onOpenWardrobe={() => { setWardrobeOpen(true); setProfileOpen(false); }}
          onLogout={logout}
        />

        <MirrorToast error={uiError} success={uiSuccess} />

        <div className="mirror-grid">
          <MirrorLeftColumn
            personImage={basePersonImage}
            processingImage={processingImage}
            accessoryItems={accessoryItems}
            dailyPlans={dailyPlans.data ?? []}
            lipsticks={recommendedLipsticks}
            selectedShade={selectedShade}
            appliedShade={appliedShade}
            selectedLipstick={selectedLipstick}
            onSelectShade={setSelectedShade}
            onApplyShade={() => setAppliedShade(lipsticks.find((lipstick) => lipstick.id === selectedShade)?.color ?? selectedLipstick?.color ?? null)}
            onUploadPerson={() => personInput.current?.click()}
            onOpenAccessories={() => { setAccessoryTab("list"); setAccessoryOpen(true); }}
            onOpenPlans={() => setPlanOpen(true)}
            onOpenLipsticks={() => setLipstickOpen(true)} // <-- Sol kolondan Ruj modalını açma yönlendirmesi
          />

          <MirrorStage
            personInput={personInput}
            person={person}
            basePersonImage={basePersonImage}
            activeJob={activeJob}
            mirrorView={mirrorView}
            onMirrorViewChange={setMirrorView}
            onPersonChange={setPerson}
            onUpload={handlePersonUpload}
            onCancelUpload={() => setPerson(undefined)}
            onNextShade={() => setSelectedShade(String((Number(selectedShade) % 5) + 1))}
          />

          <WardrobePanel
            garments={recommendedGarments}
            selectedGarment={selectedGarment}
            basePersonImage={basePersonImage}
            isTryingOn={createTryOn.isPending}
            onSelectGarment={setSelectedGarment}
            onTryOn={handleTryOn}
            onOpenWardrobe={() => setWardrobeOpen(true)}
          />
        </div>
      </section>

      {accessoryOpen && (
        <AccessoryModal
          items={accessoryItems}
          tab={accessoryTab}
          name={accessoryName}
          category={accessoryCategory}
          file={accessoryFile}
          previewUrl={accessoryPreviewUrl}
          onTabChange={setAccessoryTab}
          onNameChange={setAccessoryName}
          onCategoryChange={setAccessoryCategory}
          onFileChange={handleAccessoryFileChange}
          onAdd={handleAddAccessory}
          onRemove={handleRemoveAccessory}
          onResetAdd={resetAccessoryAddForm}
          onClose={() => setAccessoryOpen(false)}
        />
      )}

      {/* Ruj Modalı Entegrasyonu */}
      {lipstickOpen && (
        <LipstickModal
          isOpen={lipstickOpen}
          onClose={() => setLipstickOpen(false)}
          onSuccess={() => {
            fetchLipsticks(); // Listeyi güncelle
          }}
        />
      )}

      {planOpen && (
        <DailyPlanModal
          dailyPlans={dailyPlans.data ?? []}
          time={planTime}
          title={planTitle}
          onTimeChange={setPlanTime}
          onTitleChange={setPlanTitle}
          onAdd={handleAddDailyPlan}
          onRemove={handleRemoveDailyPlan}
          onClose={() => setPlanOpen(false)}
        />
      )}

      <WardrobeManagementModal
        open={wardrobeOpen}
        garments={visibleGarments}
        selectedGarment={selectedGarment}
        isUploading={addGarment.isPending}
        onSelectGarment={setSelectedGarment}
        onDeleteGarment={handleDeleteGarment}
        onAddGarment={handleAddGarment}
        onClose={() => setWardrobeOpen(false)}
      />
    </main>
  );
}