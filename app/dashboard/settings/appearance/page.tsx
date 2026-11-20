'use client';

import {useRef, useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {useBranding, BrandingSaveInput} from '@/components/providers/branding-provider';
import {hasPermission, PERMISSIONS} from '@/lib/auth/permissions.constants';
import {
    BRAND_PRESETS,
    contrastColor,
    DEFAULT_BRAND_COLOR,
    DEFAULT_CHART_COLORS,
    DEFAULT_ORG_THEME,
    DEFAULT_STATUS_COLORS,
    HEADER_PRESETS,
    LOGO_MIME_TYPES,
    MAX_LOGO_BYTES,
    STATUS_COLOR_KEYS,
    THEME_PRESETS,
    withAlpha,
    type OrgTheme,
    type StatusColorKey,
    type StatusColors,
    type ThemePreset
} from '@/lib/org/branding.constants';
import {useAuthStore} from '@/stores/auth.store';
import {useTheme} from 'next-themes';
import {
    Building2,
    Check,
    Image as ImageIcon,
    Loader2,
    MonitorSmartphone,
    Moon,
    Palette,
    ShieldCheck,
    Sun,
    Trash2,
    Upload
} from 'lucide-react';
import {OrganizationAppearance} from '@/types/org';

const THEME_OPTIONS: {value: OrgTheme; label: string; icon: typeof Sun}[] = [
    {value: 'light', label: 'Светлая', icon: Sun},
    {value: 'dark', label: 'Тёмная', icon: Moon},
    {value: 'system', label: 'Как в системе', icon: MonitorSmartphone}
];

const STATUS_COLOR_LABELS: Record<StatusColorKey, string> = {
    expected: 'Ожидается',
    seated: 'За столом',
    completed: 'Завершена',
    cancelled: 'Отменена'
};

function isPresetActive(
    preset: ThemePreset,
    brandColor: string,
    headerColor: string | null,
    statusColors: StatusColors,
    chartColors: string[]
): boolean {
    return (
        preset.brandColor === brandColor &&
        preset.headerColor === headerColor &&
        STATUS_COLOR_KEYS.every(key => preset.statusColors[key] === statusColors[key]) &&
        preset.chartColors.every((color, index) => color === chartColors[index])
    );
}

export default function AppearancePage() {
    const {appearance, orgName, loading} = useBranding();
    const permissions = useAuthStore(state => state.permissions);

    // Цвета — org.appearance.edit, логотип — отдельное право org.appearance.logo
    const canEditBranding = hasPermission(permissions, PERMISSIONS.ORG_APPEARANCE_EDIT);
    const canEditLogo = hasPermission(permissions, PERMISSIONS.ORG_APPEARANCE_LOGO);

    // При смене сохранённого оформления форма пересоздаётся с новыми значениями
    const formKey = appearance
        ? JSON.stringify({
              brand: appearance.brandColor,
              header: appearance.headerColor,
              theme: appearance.defaultTheme,
              status: appearance.statusColors,
              chart: appearance.chartColors,
              logo: appearance.logoVersion
          })
        : 'empty';

    return (
        <div className='max-w-3xl space-y-6'>
            {/* Личная тема — доступна всем */}
            <div className='rounded-2xl border border-app-border bg-surface/60 p-8 backdrop-blur-sm'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10'>
                        <Sun size={18} className='text-brand' />
                    </div>
                    <div>
                        <h2 className='text-sm font-semibold text-app-fg'>Ваша тема</h2>
                        <p className='text-xs text-app-subtle'>
                            Личная настройка — не влияет на других сотрудников
                        </p>
                    </div>
                </div>

                <PersonalThemeSection />
            </div>

            {/* Оформление организации — по праву org.appearance.edit */}
            <div className='rounded-2xl border border-app-border bg-surface/60 p-8 backdrop-blur-sm'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10'>
                        <Palette size={18} className='text-brand' />
                    </div>
                    <div>
                        <h2 className='text-sm font-semibold text-app-fg'>Оформление организации</h2>
                        <p className='text-xs text-app-subtle'>
                            {orgName
                                ? `Цвета и логотип для «${orgName}» — видят все сотрудники`
                                : 'Цвета и логотип организации — видят все сотрудники'}
                        </p>
                    </div>
                </div>

                {!canEditBranding && (
                    <div className='mb-5 flex items-start gap-3 rounded-lg border border-app-border bg-surface-2/50 px-4 py-3'>
                        <ShieldCheck size={16} className='mt-0.5 shrink-0 text-app-subtle' />
                        <p className='text-sm text-app-muted'>
                            Цвета интерфейса настраивает администратор организации. Ваша личная
                            тема — в блоке выше, она сохраняется только для вас.
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className='flex items-center gap-2 py-10 text-sm text-app-subtle'>
                        <Loader2 size={16} className='animate-spin' />
                        Загружаем настройки...
                    </div>
                ) : !orgName ? (
                    <div className='flex items-center gap-3 rounded-lg border border-app-border bg-surface-2/40 px-4 py-3'>
                        <Building2 size={16} className='shrink-0 text-app-subtle' />
                        <p className='text-sm text-app-muted'>
                            Организация ещё не создана. Оформление станет доступно после её
                            регистрации.
                        </p>
                    </div>
                ) : (
                    <AppearanceForm
                        key={formKey}
                        appearance={appearance}
                        orgName={orgName}
                        canEdit={canEditBranding}
                        canEditLogo={canEditLogo}
                    />
                )}
            </div>
        </div>
    );
}

/** Личная тема: применяется сразу, хранится в браузере */
function PersonalThemeSection() {
    const {theme} = useTheme();
    const {chooseTheme, appearance, resetToOrganizationTheme} = useBranding();

    return (
        <section>
            <div className='inline-flex flex-wrap gap-1 rounded-xl border border-app-border bg-surface-2/40 p-1'>
                {THEME_OPTIONS.map(option => {
                    const Icon = option.icon;
                    const isActive = theme === option.value;
                    return (
                        <button
                            key={option.value}
                            type='button'
                            onClick={() => chooseTheme(option.value)}
                            className={[
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive
                                    ? 'bg-surface font-medium text-app-fg shadow-sm'
                                    : 'text-app-muted hover:text-app-fg'
                            ].join(' ')}
                        >
                            <Icon size={15} />
                            {option.label}
                        </button>
                    );
                })}
            </div>
            <p className='mt-2 text-xs text-app-subtle'>
                Выбор сохраняется для вашего аккаунта в этом браузере и имеет приоритет над темой
                организации.
            </p>
            {appearance && (
                <button
                    type='button'
                    onClick={resetToOrganizationTheme}
                    className='mt-2 text-xs font-medium text-brand transition-colors hover:text-brand/80'
                >
                    Использовать тему организации по умолчанию
                </button>
            )}
        </section>
    );
}

interface AppearanceFormProps {
    appearance: OrganizationAppearance | null;
    orgName: string;
    canEdit: boolean;
    canEditLogo: boolean;
}

function AppearanceForm({appearance, orgName, canEdit, canEditLogo}: AppearanceFormProps) {
    const {logoUrl, saving, save} = useBranding();

    const [brandColor, setBrandColor] = useState(appearance?.brandColor ?? DEFAULT_BRAND_COLOR);
    const [headerColor, setHeaderColor] = useState<string | null>(
        appearance?.headerColor ?? null
    );
    const [defaultTheme, setDefaultTheme] = useState<OrgTheme>(
        appearance?.defaultTheme ?? DEFAULT_ORG_THEME
    );
    const [statusColors, setStatusColors] = useState<StatusColors>({
        ...(appearance?.statusColors ?? DEFAULT_STATUS_COLORS)
    });
    const [chartColors, setChartColors] = useState<string[]>([
        ...(appearance?.chartColors ?? DEFAULT_CHART_COLORS)
    ]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const applyPreset = (preset: ThemePreset) => {
        setBrandColor(preset.brandColor);
        setHeaderColor(preset.headerColor);
        setStatusColors({...preset.statusColors});
        setChartColors([...preset.chartColors]);
    };

    const updateStatusColor = (key: StatusColorKey, value: string) => {
        setStatusColors(current => ({...current, [key]: value}));
    };

    const updateChartColor = (index: number, value: string) => {
        setChartColors(current => current.map((color, i) => (i === index ? value : color)));
    };

    const resetLogo = () => {
        setLogoPreview(null);
        setLogoRemoved(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
            toast.error('Поддерживаются PNG, JPEG и WebP');
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            toast.error('Логотип должен быть не больше 256 КБ');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setLogoPreview(String(reader.result));
            setLogoRemoved(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        const input: BrandingSaveInput = {
            brandColor,
            headerColor,
            defaultTheme,
            statusColors,
            chartColors,
            ...(logoPreview ? {logoDataUrl: logoPreview} : {}),
            ...(logoRemoved && !logoPreview ? {removeLogo: true} : {})
        };

        const ok = await save(input);
        if (ok) {
            toast.success('Оформление организации сохранено');
        } else {
            toast.error('Не удалось сохранить оформление');
        }
    };

    const effectiveLogo = logoPreview ?? (logoRemoved ? null : logoUrl);
    const previewHeaderFg = headerColor ? contrastColor(headerColor) : undefined;
    const previewBrandFg = contrastColor(brandColor);

    return (
        <fieldset disabled={!canEdit || saving} className='space-y-7'>
            {/* Готовые темы */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Готовые темы
                </Label>
                <p className='mb-3 text-xs text-app-subtle'>
                    Один клик задаёт акцент, шапку, цвета статусов и палитру графиков.
                    Не забудьте сохранить.
                </p>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                    {THEME_PRESETS.map(preset => {
                        const active = isPresetActive(
                            preset,
                            brandColor,
                            headerColor,
                            statusColors,
                            chartColors
                        );

                        return (
                            <button
                                key={preset.key}
                                type='button'
                                onClick={() => applyPreset(preset)}
                                className={[
                                    'rounded-xl border p-3 text-left transition-colors',
                                    active
                                        ? 'border-brand/60 bg-brand/5'
                                        : 'border-app-border bg-surface-2/30 hover:border-app-border hover:bg-surface-2/60'
                                ].join(' ')}
                            >
                                <div className='flex items-center justify-between gap-2'>
                                    <div className='flex -space-x-1'>
                                        {[
                                            preset.brandColor,
                                            ...preset.chartColors.slice(0, 3)
                                        ].map((color, index) => (
                                            <span
                                                key={`${color}-${index}`}
                                                className='h-5 w-5 rounded-full border-2 border-surface'
                                                style={{backgroundColor: color}}
                                            />
                                        ))}
                                    </div>
                                    {active && <Check size={15} className='text-brand' />}
                                </div>
                                <p className='mt-2 text-sm font-medium text-app-fg'>
                                    {preset.name}
                                </p>
                                <p className='text-[11px] text-app-subtle'>
                                    {preset.description}
                                </p>
                                <div className='mt-2 flex gap-1'>
                                    {STATUS_COLOR_KEYS.map(key => (
                                        <span
                                            key={key}
                                            className='h-1.5 flex-1 rounded-full'
                                            style={{
                                                backgroundColor: preset.statusColors[key]
                                            }}
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Основной цвет */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Основной цвет (акценты, кнопки)
                </Label>
                <div className='flex flex-wrap items-center gap-2'>
                    {BRAND_PRESETS.map(preset => (
                        <button
                            key={preset.value}
                            type='button'
                            title={preset.name}
                            onClick={() => setBrandColor(preset.value)}
                            className={[
                                'flex h-9 w-9 items-center justify-center rounded-lg border transition-transform hover:scale-105',
                                brandColor === preset.value
                                    ? 'border-app-fg/40'
                                    : 'border-app-border'
                            ].join(' ')}
                            style={{backgroundColor: preset.value}}
                        >
                            {brandColor === preset.value && (
                                <Check size={16} style={{color: contrastColor(preset.value)}} />
                            )}
                        </button>
                    ))}

                    <label className='flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-app-border px-3 text-sm text-app-muted transition-colors hover:text-app-fg'>
                        <input
                            type='color'
                            value={brandColor}
                            onChange={event => setBrandColor(event.target.value)}
                            className='h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0'
                        />
                        Свой цвет
                    </label>
                </div>
            </section>

            {/* Цвет шапки и меню */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Цвет шапки и бокового меню
                </Label>
                <div className='flex flex-wrap items-center gap-2'>
                    {HEADER_PRESETS.map(preset => {
                        const isActive = headerColor === preset.value;
                        return (
                            <button
                                key={preset.name}
                                type='button'
                                title={preset.name}
                                onClick={() => setHeaderColor(preset.value)}
                                className={[
                                    'flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs transition-colors',
                                    isActive
                                        ? 'border-app-fg/40 font-medium text-app-fg'
                                        : 'border-app-border text-app-muted hover:text-app-fg'
                                ].join(' ')}
                                style={preset.value ? {backgroundColor: preset.value} : undefined}
                            >
                                {preset.value === null ? (
                                    'По умолчанию'
                                ) : (
                                    <>
                                        {isActive && (
                                            <Check
                                                size={14}
                                                style={{color: contrastColor(preset.value)}}
                                            />
                                        )}
                                        {!isActive && <span className='h-4 w-4' />}
                                    </>
                                )}
                            </button>
                        );
                    })}

                    <label className='flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-app-border px-3 text-sm text-app-muted transition-colors hover:text-app-fg'>
                        <input
                            type='color'
                            value={headerColor ?? '#18181b'}
                            onChange={event => setHeaderColor(event.target.value)}
                            className='h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0'
                        />
                        Свой цвет
                    </label>
                </div>
            </section>

            {/* Тема организации по умолчанию */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Тема по умолчанию для сотрудников
                </Label>
                <div className='inline-flex flex-wrap gap-1 rounded-xl border border-app-border bg-surface-2/40 p-1'>
                    {THEME_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isActive = defaultTheme === option.value;

                        return (
                            <button
                                key={option.value}
                                type='button'
                                onClick={() => setDefaultTheme(option.value)}
                                className={[
                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                                    isActive
                                        ? 'bg-surface font-medium text-app-fg shadow-sm'
                                        : 'text-app-muted hover:text-app-fg'
                                ].join(' ')}
                            >
                                <Icon size={15} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                <p className='mt-2 text-xs text-app-subtle'>
                    Применяется к сотрудникам, которые ещё не выбрали личную тему.
                </p>
            </section>

            {/* Цвета статусов */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Цвета статусов
                </Label>
                <p className='mb-3 text-xs text-app-subtle'>
                    Используются в бейджах и лентах статусов броней.
                </p>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    {STATUS_COLOR_KEYS.map(key => (
                        <div
                            key={key}
                            className='flex items-center justify-between gap-3 rounded-lg border border-app-border bg-surface-2/30 px-3 py-2'
                        >
                            <span className='flex items-center gap-2 text-sm text-app-muted'>
                                <span
                                    className='h-2.5 w-2.5 rounded-full'
                                    style={{backgroundColor: statusColors[key]}}
                                />
                                {STATUS_COLOR_LABELS[key]}
                            </span>
                            <span className='flex items-center gap-2'>
                                <span className='font-mono text-[10px] uppercase text-app-subtle'>
                                    {statusColors[key]}
                                </span>
                                <input
                                    type='color'
                                    value={statusColors[key]}
                                    onChange={event =>
                                        updateStatusColor(key, event.target.value)
                                    }
                                    className='h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0'
                                />
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Палитра графиков */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Палитра графиков
                </Label>
                <p className='mb-3 text-xs text-app-subtle'>
                    Пять цветов для графиков и диаграмм.
                </p>
                <div className='flex flex-wrap gap-2'>
                    {chartColors.map((color, index) => (
                        <label
                            key={index}
                            className='flex cursor-pointer items-center gap-2 rounded-lg border border-app-border bg-surface-2/30 px-3 py-2 text-xs text-app-muted'
                        >
                            <input
                                type='color'
                                value={color}
                                onChange={event =>
                                    updateChartColor(index, event.target.value)
                                }
                                className='h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0'
                            />
                            График {index + 1}
                        </label>
                    ))}
                </div>
            </section>

            {/* Логотип — отдельное право org.appearance.logo */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Логотип организации
                </Label>

                <fieldset disabled={!canEditLogo || saving}>
                    <div className='flex flex-wrap items-center gap-4'>
                        <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-app-border bg-surface-2/40'>
                            {effectiveLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={effectiveLogo}
                                    alt='Логотип'
                                    className='h-full w-full object-cover'
                                />
                            ) : (
                                <Building2 size={22} className='text-app-subtle' />
                            )}
                        </div>

                        <div className='flex flex-wrap gap-2'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/png,image/jpeg,image/webp'
                                onChange={handleLogoSelect}
                                className='hidden'
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='gap-2'
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} />
                                Загрузить
                            </Button>
                            {(logoUrl || logoPreview) && !logoRemoved && (
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    className='gap-2 text-red-400 hover:text-red-400'
                                    onClick={() => {
                                        setLogoPreview(null);
                                        setLogoRemoved(true);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Удалить
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className='mt-2 flex items-center gap-1.5 text-xs text-app-subtle'>
                        <ImageIcon size={12} />
                        PNG, JPEG или WebP, до 256 КБ
                    </p>
                </fieldset>

                {!canEditLogo && (
                    <p className='mt-2 text-xs text-app-subtle'>
                        Логотип может изменить только администратор организации.
                    </p>
                )}
            </section>

            {/* Превью */}
            <section>
                <Label className='mb-2 block text-xs font-medium uppercase tracking-wider text-app-muted'>
                    Предпросмотр
                </Label>
                <div className='overflow-hidden rounded-xl border border-app-border'>
                    <div
                        className={
                            headerColor
                                ? 'flex items-center justify-between px-3 py-2.5'
                                : 'flex items-center justify-between bg-header px-3 py-2.5 text-header-fg'
                        }
                        style={
                            headerColor
                                ? {backgroundColor: headerColor, color: previewHeaderFg}
                                : undefined
                        }
                    >
                        <div className='flex items-center gap-2'>
                            {effectiveLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={effectiveLogo}
                                    alt=''
                                    className='h-6 w-6 rounded-md object-cover'
                                />
                            ) : (
                                <span
                                    className='flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold'
                                    style={{
                                        backgroundColor: brandColor,
                                        color: previewBrandFg
                                    }}
                                >
                                    {orgName.slice(0, 1).toUpperCase()}
                                </span>
                            )}
                            <span className='text-sm font-semibold'>{orgName}</span>
                        </div>
                        <span
                            className='rounded-md px-2 py-1 text-[11px] font-medium'
                            style={{backgroundColor: brandColor, color: previewBrandFg}}
                        >
                            Кнопка
                        </span>
                    </div>
                    <div className='space-y-3 bg-app p-3'>
                        <div className='h-2.5 w-2/3 rounded-full bg-app-fg/10' />
                        <div className='h-2.5 w-1/2 rounded-full bg-app-fg/10' />
                        <div
                            className='h-2.5 w-1/3 rounded-full'
                            style={{backgroundColor: brandColor}}
                        />
                        <div className='flex flex-wrap gap-1.5'>
                            {STATUS_COLOR_KEYS.map(key => (
                                <span
                                    key={key}
                                    className='rounded-full px-2 py-0.5 text-[10px] font-medium'
                                    style={{
                                        color: statusColors[key],
                                        backgroundColor: withAlpha(statusColors[key], 0.14)
                                    }}
                                >
                                    {STATUS_COLOR_LABELS[key]}
                                </span>
                            ))}
                        </div>
                        <div className='flex items-end gap-1.5'>
                            {chartColors.map((color, index) => (
                                <span
                                    key={index}
                                    className='w-4 rounded-t'
                                    style={{
                                        backgroundColor: color,
                                        height: `${12 + index * 5}px`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {canEdit && (
                <div className='flex items-center gap-3 border-t border-app-border pt-5'>
                    <Button
                        type='button'
                        onClick={handleSave}
                        disabled={saving}
                        className='gap-2 bg-brand font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-40'
                    >
                        {saving && <Loader2 size={15} className='animate-spin' />}
                        Сохранить
                    </Button>
                    <Button
                        type='button'
                        variant='ghost'
                        onClick={() => {
                            setBrandColor(appearance?.brandColor ?? DEFAULT_BRAND_COLOR);
                            setHeaderColor(appearance?.headerColor ?? null);
                            setDefaultTheme(appearance?.defaultTheme ?? DEFAULT_ORG_THEME);
                            setStatusColors({
                                ...(appearance?.statusColors ?? DEFAULT_STATUS_COLORS)
                            });
                            setChartColors([
                                ...(appearance?.chartColors ?? DEFAULT_CHART_COLORS)
                            ]);
                            resetLogo();
                        }}
                    >
                        Сбросить
                    </Button>
                </div>
            )}
        </fieldset>
    );
}
