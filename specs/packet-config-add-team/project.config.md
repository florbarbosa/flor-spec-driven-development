---
project_slug: "packet-config-add-team"
linear_project_id: "72939361-6650-4986-9160-1377e1605ff3"
linear_project_url: "https://linear.app/joinhomebase/project/packet-configuration-streamline-how-packets-are-set-up-and-sent-during-54810b23e043/overview"
target_repo: "/Users/fbarbosa/Documents/Homebase1"
default_branch: "main"
tech_stack:
  frontend: "react-typescript"
  backend: "ruby-on-rails"
  design_system: "homebase-designbase"
figma_urls:
  - label: "New Hire Packets — Documents"
    url: "https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=19-498&p=f&m=dev"
---

# Project Config — Packet Configuration: Add Team

> Written by `/setup`. Read by all downstream skills. Do not edit manually.

## Reference Materials

| Type | Label | URL or Path |
|------|-------|-------------|
| `figma` | New Hire Packets — Documents | https://www.figma.com/design/HSvGEOyEmuDtUGcpOQ8Xpy/New-Hire-Packets---Documents?node-id=19-498&p=f&m=dev |

## Milestones

| Milestone ID | Name | Target Date | Status |
|-------------|------|-------------|--------|
| `cf5308f6-b416-465c-8eb2-d16f13ac7309` | Port Add Team to new Child Page | 2026-07-03 | `planned` |
| `ccfa5df7-39a0-456f-959e-ea3c0e6c083e` | Create Second Child Page with Embedded Packet Configuration | 2026-07-22 | `planned` |
| `a66a8da6-ac67-480c-9ea9-7bcf76f3c3e4` | Add Previews | 2026-07-30 | `planned` |

## Notes

Project is part of the Documents Rethink work stream. The core problem: the New Hire Packet option in the Add Team invite flow depends on prior configuration that many OAMs have never done — making it invisible at the moment they need it most. The solution replaces the existing Add Team bottom-sheet modal with a 2-step full-page experience where packet configuration is embedded at send time, not on a separate config page.

Key design decisions from Linear:
- Invite flow becomes the primary send surface
- Live packet preview so OAMs see exactly what the employee receives before sending
- Flat doc list (individual checkboxes) replaces category toggles
- Section 5 (Send Test Email Modal) is struck through / out of scope in current Linear AC

Issues: 0 assigned to project at setup time. `/spec-author` will propose a breakdown per milestone.
