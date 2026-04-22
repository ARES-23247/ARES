import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { ModalProvider } from "./contexts/ModalContext";

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

describe("App Router Setup", () => {
  it("renders the app successfully without crashing", () => {
    const queryClient = new QueryClient();
    
    const { container } = render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ModalProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ModalProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );

    // Navbar mounting should inject main-content block.
    expect(container.querySelector("#main-content")).toBeInTheDocument();
  });
});
