import { AnnouncementBar } from "@/components/store/announcement";
import { CartDrawer } from "@/components/store/cart-drawer";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { StoreProvider } from "@/components/store/store-context";
import { getSettings } from "@/lib/data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, navigation, theme } = await getSettings();
  return (
    <StoreProvider value={{ name: store.name, currencyCode: store.currencyCode, locale: store.locale }}>
      <div className="store flex min-h-dvh flex-col">
        {navigation.announcementEnabled && (
          <AnnouncementBar messages={navigation.announcements} href={navigation.announcementHref} />
        )}
        <Header
          name={store.name}
          logo={store.logo}
          links={navigation.header}
          layout={theme.headerLayout}
          sticky={theme.headerSticky}
        />
        <main className="flex-1">{children}</main>
        <Footer store={store} nav={navigation} />
        <CartDrawer />
      </div>
    </StoreProvider>
  );
}
