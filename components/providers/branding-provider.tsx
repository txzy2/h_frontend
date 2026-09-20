'use client';

import {contrastColor, DEFAULT_BRAND_COLOR, OrgTheme} from '@/lib/org/branding.constants';
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
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function applyToDocument(appearance: OrganizationAppearance | null): void {
    const root = document.documentElement;

    if (!appearance) {
        for (const property of ['--brand', '--brand-fg', '--header-bg', '--header-fg']) {
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
        } catch {
            // не критично — останутся значения по умолчанию
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, []);

    const save = useCallback(async (input: BrandingSaveInput): Promise<boolean> => {
        setSaving(true);
        try {
            const response = await fetch('/api/org/appearance', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'same-origin',
                body: JSON.stringify(input)
            });

            const body = (await response.json()) as UpdateOrganizationAppearanceResponse;
            if (!response.ok || !body.success) return false;

            setAppearance(body.data);
            applyToDocument(body.data);
            return true;
        } catch {
            return false;
        } finally {
            if (isMountedRef.current) setSaving(false);
        }
    }, []);

    const chooseTheme = useCallback((theme: OrgTheme) => setTheme(theme), [setTheme]);

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
            chooseTheme
        }),
        [appearance, orgName, logoUrl, loading, saving, save, refresh, chooseTheme]
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
