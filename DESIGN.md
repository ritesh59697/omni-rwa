---
name: OmniRWA
description: Institutional RWA Restaking & Autonomous AI Yield Engine
colors:
  primary: "#00D492"
  primary-hover: "#00B87D"
  bg-app: "#080A0F"
  bg-surface: "#0E121A"
  bg-surface-elevated: "#182030"
  border-default: "#1F283B"
  border-accent: "#00D492"
  text-pure: "#FFFFFF"
  text-primary: "#F1F5F9"
  text-secondary: "#94A3B8"
  text-tertiary: "#64748B"
typography:
  display:
    fontFamily: "Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif"
  body:
    fontFamily: "Inter Tight, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    lineHeight: 1.55
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#040806"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#040806"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.bg-surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
---

# Design System: OmniRWA

## Overview

**Creative North Star: "The Institutional Vault"**

OmniRWA's interface is designed to emulate Swiss banking systems: matte dark/light backgrounds, high contrast ratio typography, high-density layouts, and high-precision tabular numbers. We avoid excessive glows, heavy gradients, and non-functional animations. The layout is structured around asymmetric grids and 1px borders, offering professional clarity.

**Key Characteristics:**
- High-contrast, dense informational layouts.
- Monospace font alignments for all numeric/financial values.
- Subtle, high-performance animations and tactile state responses.
- Single purposeful primary accent usage (Green).

## Colors

The palette uses a high-contrast matte base structure with green accent highlights.

### Primary
- **Institutional Green** (#00D492): Used solely for primary calls-to-action, success states, and the dynamic live-indicator.

### Neutral
- **Deep Matte App BG** (#080A0F): Deep base background for dark mode.
- **Elevation Layer Surface** (#0E121A): Dark card container backgrounds.
- **Pure Text white** (#FFFFFF): Used for display headings and high-priority copy.
- **Primary Text grey** (#F1F5F9): Default body readability.

### Named Rules
**The Rarity Accent Rule.** The primary green accent must occupy less than 5% of any page surface. It acts as an intentional beacon for user attention.

## Typography

**Display Font:** Space Grotesk
**Body Font:** Inter Tight
**Label/Mono Font:** JetBrains Mono

### Hierarchy
- **Display** (bold, 1.35rem): Used for section headings and statement highlights.
- **Body** (regular, 15px, 1.55): Main copy and details.
- **Label/Mono** (medium, 14px): Financial quantities, asset ticks, code tags, and rates.

## Layout

The page structure follows an asymmetric hero block with a grid alignment below. Container width is bounded at a maximum of `1360px` with responsive single-column collapse under `1080px`.

## Elevation & Depth

Surficial elements are flat at rest, divided by thin borders. Shadows are used exclusively as dynamic hover responses.

### Named Rules
**The Flat-By-Default Rule.** Containers are completely flat at rest. Subtle shadow depth is only applied interactively on mouse hover.

## Shapes

Shapes are strictly rectangular with subtle rounded corners:
- Small components (buttons, tags): 6px radius.
- Large containers (strategy cards, metrics): 10px or 14px radius.

## Components

### Buttons
- **Shape:** Soft-corner rounded (6px radius).
- **Primary:** High-contrast accent background with dark text, active scaling transition.
- **Hover:** Darker green shade transition.

### Cards / Containers
- **Corner Style:** Standard rounded (10px or 14px radius).
- **Background:** Flat surface (#0E121A).
- **Hover:** Lift translateY(-2px) with glow highlight transition.

## Do's and Don'ts

### Do:
- **Do** wrap hover actions in media queries to protect mobile tap states.
- **Do** enforce monospace tabular alignments for all quantities.

### Don't:
- **Don't** use pure system font stacks or overused generic san-serif fallbacks.
- **Don't** animate elements that users trigger frequently.
