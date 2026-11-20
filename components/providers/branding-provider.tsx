'use client';

import {
    contrastColor,
    DEFAULT_BRAND_COLOR,
    DEFAULT_CHART_COLORS,
    DEFAULT_ORG_THEME,
    DEFAULT_STATUS_COLORS,
    type OrgTheme,
    type StatusColors
} from '@/lib/org/branding.constants';
import {useAuthStore} from '@/stores/auth.store';
import {
    OrganizationAppearance,
    OrganizationAppearanceResponse,
    UpdateOrganizationAppearanceResponse
} from '@/types/org';
import {useTheme} from 'next-themes';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

export type BrandingSaveInput = {
    brandColor: string;
    headerColor: string | null;
    defaultTheme: OrgTheme;
    statusColors: StatusColors;
    chartColors: string[];
    logoDataUrl?: string;
    removeLogo?: boolean;
};

type BrandingContextValue = {
    appearance: OrganizationAppearance | null;
    orgName: string | null;
    logoUrl: string | null;
    loading: boolean;
    saving: boolean;
    save: (input: BrandingSaveInput) => Promise<boolean>;
    refresh: () => Promise<void>;
    chooseTheme: (theme: OrgTheme) => void;
    resetToOrganizationTheme: () => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function applyToDocument(appearance: OrganizationAppearance | null): void {
    const root = document.documentElement;
    const chartProperties = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];
    const statusProperties = [
        '--status-expected',
        '--status-seated',
        '--status-completed',
        '--status-cancelled'
    ];

    if (!appearance) {
        for (const property of [
            '--brand',
            '--brand-fg',
            '--header-bg',
            '--header-fg',
            ...chartProperties,
            ...statusProperties
        ]) {
            root.style.removeProperty(property);
        }
        return;
    }

    const brand = appearance.brandColor || DEFAULT_BRAND_COLOR;
    root.style.setProperty('--brand', brand);
    root.style.setProperty('--brand-fg', contrastColor(brand));

    if (appearance.headerColor) {
        root.style.setProperty('--header-bg', appearance.headerColor);
        root.style.setProperty('--header-fg', contrastColor(appearance.headerColor));
    } else {
        root.style.removeProperty('--header-bg');
        root.style.removeProperty('--header-fg');
    }

    const chartColors = appearance.chartColors?.length
        ? appearance.chartColors
        : DEFAULT_CHART_COLORS;
    chartColors.slice(0, 5).forEach((color, index) => {
        root.style.setProperty(chartProperties[index], color);
    });

    const statusColors = appearance.statusColors ?? DEFAULT_STATUS_COLORS;
    root.style.setProperty('--status-expected', statusColors.expected);
    root.style.setProperty('--status-seated', statusColors.seated);
    root.style.setProperty('--status-completed', statusColors.completed);
    root.style.setProperty('--status-cancelled', statusColors.cancelled);
}

export function BrandingProvider({children}: {children: ReactNode}) {
    const user = useAuthStore(state => state.user);
    const {setTheme} = useTheme();

    const [appearance, setAppearance] = useState<OrganizationAppearance | null>(null);
    const [orgName, setOrgName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const isMountedRef = useRef(true);
    const loadedUserIdRef = useRef<string | null>(null);

    const applyOrganizationTheme = useCallback(
        (theme: OrgTheme) => {
            try {
                const explicit = localStorage.getItem('theme-user-choice') === '1';
                const auto = localStorage.getItem('theme-auto') === '1';
                const stored = localStorage.getItem('theme') !== null;

                // Пользователь уже выбрал тему раньше — не перебиваем.
                if (!explicit && !auto && stored) {
                    localStorage.setItem('theme-user-choice', '1');
                    return;
                }

                if (!explicit) {
                    localStorage.setItem('theme-auto', '1');
                    setTheme(theme);
                }
            } catch {
                setTheme(theme);
            }
        },
        [setTheme]
    );

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/org/appearance', {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            if (!response.ok) return;

            const body = (await response.json()) as OrganizationAppearanceResponse;
            if (!body.success || !isMountedRef.current) return;

            setAppearance(body.data);
            setOrgName(body.orgName);
            applyToDocument(body.data);
            if (body.data) applyOrganizationTheme(body.data.defaultTheme);
        } catch {
            // не критично — останутся значения по умолчанию
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [applyOrganizationTheme]);

    const save = useCallback(
        async (input: BrandingSaveInput): Promise<boolean> => {
            setSaving(true);
            try {
                const response = await fetch('/api/org/appearance', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'same-origin',
                    body: JSON.stringify(input)
                });

                const body =
                    (await response.json()) as UpdateOrganizationAppearanceResponse;
                if (!response.ok || !body.success) return false;

                setAppearance(body.data);
                applyToDocument(body.data);
                applyOrganizationTheme(body.data.defaultTheme);
                return true;
            } catch {
                return false;
            } finally {
                if (isMountedRef.current) setSaving(false);
            }
        },
        [applyOrganizationTheme]
    );

    const chooseTheme = useCallback(
        (theme: OrgTheme) => {
            try {
                localStorage.setItem('theme-user-choice', '1');
                localStorage.removeItem('theme-auto');
            } catch {
                // localStorage может быть недоступен
            }
            setTheme(theme);
        },
        [setTheme]
    );

    const resetToOrganizationTheme = useCallback(() => {
        try {
            localStorage.setItem('theme-auto', '1');
            localStorage.removeItem('theme-user-choice');
        } catch {
            // localStorage может быть недоступен
        }
        setTheme(appearance?.defaultTheme ?? DEFAULT_ORG_THEME);
    }, [appearance, setTheme]);

    useEffect(() => {
        isMountedRef.current = true;

        if (!user) {
            loadedUserIdRef.current = null;
            setAppearance(null);
            setOrgName(null);
            applyToDocument(null);
            return;
        }

        // Оформление запрашиваем один раз на пользователя
        if (loadedUserIdRef.current === user.userId) return;
        loadedUserIdRef.current = user.userId;

        void refresh();

        return () => {
            isMountedRef.current = false;
        };
    }, [user, refresh]);

    const logoUrl = useMemo(() => {
        if (!appearance?.hasLogo) return null;
        const version = appearance.logoVersion ?? '';
        return `/api/org/logo?v=${encodeURIComponent(version)}`;
    }, [appearance]);

    const value = useMemo<BrandingContextValue>(
        () => ({
            appearance,
            orgName,
            logoUrl,
            loading,
            saving,
            save,
            refresh,
            chooseTheme,
            resetToOrganizationTheme
        }),
        [
            appearance,
            orgName,
            logoUrl,
            loading,
            saving,
            save,
            refresh,
            chooseTheme,
            resetToOrganizationTheme
        ]
    );

    return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
    const context = useContext(BrandingContext);

    if (!context) {
        throw new Error('useBranding must be used within <BrandingProvider>');
    }

    return context;
}
