import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrandLogo } from "./BrandLogo";
import { ShieldCheck } from "lucide-react";

describe("BrandLogo Component", () => {
  it("renders a loading skeleton initially, then the image", () => {
    const { container } = render(<BrandLogo domain="github.com" />);
    
    // The image should be rendered
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    
    // Pulse animation skeleton should be visible before load and opacity-0
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(img).toHaveClass("opacity-0");

    // Simulate load event
    fireEvent.load(img);
    
    // After load, the pulse should disappear and the opacity class should switch
    expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(img).toHaveClass("opacity-100");
  });

  it("safely generates a stable Google Favicon source url", () => {
    render(<BrandLogo domain="https://www.google.com/search" />);
    
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://www.google.com/s2/favicons?domain=google.com&sz=128");
  });

  it("handles image errors by falling back to the default or custom icon", async () => {
    const { container } = render(<BrandLogo domain="broken.xyz" fallbackIcon={ShieldCheck} />);
    
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    
    // Simulate error where the unavatar service fails
    fireEvent.error(img);

    // The image element should be removed, and the fallback icon (svg) should render
    await waitFor(() => {
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        // Since Fallback is basically a SVG rendered by lucide, we can check for SVG
        expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("falls back immediately without an image tag if the domain is invalid", () => {
    const { container } = render(<BrandLogo domain="" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
