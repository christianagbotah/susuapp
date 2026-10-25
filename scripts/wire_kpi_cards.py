#!/usr/bin/env python3
"""Wire shared KpiCard into the 7 remaining staff dashboards.

For each file:
  1. Insert `import { KpiCard } from '@/components/shared/kpi-card';` after the ui/card import
  2. Add `page: '<target>' as const` to every statsCards entry
  3. Replace the statsCards.map(...) render block with <KpiCard ... onClick={() => setActivePage(stat.page)} />

Fails loudly (non-zero exit) if any anchor is missing or a transform doesn't apply.
"""
import sys

BASE = '/home/z/my-project/src/components/pages'

CARD_IMPORT = "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';"
KPI_IMPORT = "import { KpiCard } from '@/components/shared/kpi-card';"

NEW_MAP = """{statsCards.map((stat, i) => (
          <KpiCard
            key={stat.title}
            index={i}
            title={stat.title}
            value={stat.value}
            sub={stat.sub}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            onClick={() => setActivePage(stat.page)}
          />
        ))}"""

# portal-dir, file, [(title-snippet, page)]
FILES = {
    'treasurer': ('treasurer-dashboard.tsx', [
        ("title: 'Groups Managed'", 'groups'),
        ("title: 'Total Pool Value'", 'reports'),
        ("title: 'Members Under Management'", 'members'),
        ("title: 'Pending Payouts'", 'payouts'),
    ]),
    'branch-manager': ('branch-manager-dashboard.tsx', [
        ("title: 'Active Staff'", 'staff'),
        ("title: 'Loans Awaiting Approval'", 'loan-approvals'),
        ("title: 'Approval Queue Value'", 'loan-approvals'),
        ("title: 'Staff Performance Avg'", 'targets'),
    ]),
    'loan-officer': ('loan-officer-dashboard.tsx', [
        ("title: 'Active Pipeline'", 'pipeline'),
        ("title: 'Awaiting Appraisal'", 'appraisals'),
        ("title: 'Recommended to BM'", 'pipeline'),
        ("title: 'Portfolio At Risk (30)'", 'portfolio'),
    ]),
    'teller': ('teller-dashboard.tsx', [
        ("title: 'Drawer Balance (expected)'", 'vault'),
        ("title: 'Cash In / Out Today'", 'counter'),
        ("title: 'Customers Waiting'", 'counter'),
        ("title: 'Processed Today'", 'counter'),
    ]),
    'field-supervisor': ('field-supervisor-dashboard.tsx', [
        ("title: 'Agents in Field'", 'agents'),
        ("title: 'Collected Today'", 'routes'),
        ("title: 'Collection Rate'", 'routes'),
        ("title: 'Pending Verification'", 'spot-checks'),
    ]),
    'accountant': ('accountant-dashboard.tsx', [
        ("title: 'Total Assets'", 'ledger'),
        ("title: 'Member Deposits (Susu)'", 'ledger'),
        ("title: 'Net Income YTD'", 'statements'),
        ("title: 'Reconciliation Variances'", 'reconciliation'),
    ]),
    'compliance-officer': ('compliance-dashboard.tsx', [
        ("title: 'Open AML Alerts'", 'aml-alerts'),
        ("title: 'STRs Filed (YTD)'", 'str-reports'),
        ("title: 'Regulatory Returns Due'", 'bog-returns'),
        ("title: 'KYC Compliance'", 'aml-alerts'),
    ]),
}

def transform(path, entries):
    with open(path, 'r') as f:
        lines = f.read().split('\n')

    # 1) import (idempotent)
    if KPI_IMPORT not in '\n'.join(lines):
        idx = next(i for i, l in enumerate(lines) if l.strip() == CARD_IMPORT.strip())
        lines.insert(idx + 1, KPI_IMPORT)

    # 2) page fields
    for snippet, page in entries:
        hit = [i for i, l in enumerate(lines) if snippet in l]
        assert len(hit) == 1, f"{path}: title snippet {snippet!r} matched {len(hit)} lines"
        t = hit[0]
        line = lines[t]
        if line.rstrip().endswith("},"):
            # single-line entry: drop trailing '},', append page field, restore '},'
            stripped = line.rstrip()
            assert stripped.endswith("' },") or stripped.endswith("} },"), (
                f"{path}: unexpected single-line entry ending: {stripped[-12:]!r}")
            lines[t] = stripped[:-2].rstrip() + ", page: '" + page + "' as const },"
        else:
            # multi-line entry: insert page line before the entry-closing '    },'
            c = next(j for j in range(t + 1, t + 8) if lines[j].rstrip() == '    },')
            lines.insert(c, "      page: '" + page + "' as const,")

    # 3) replace statsCards.map block
    content = '\n'.join(lines)
    start = content.index('{statsCards.map((stat, i) => (')
    end = content.index('))}', start) + 3
    old_block = content[start:end]
    content = content[:start] + NEW_MAP + content[end:]

    with open(path, 'w') as f:
        f.write(content)
    return old_block

for portal, (fname, entries) in FILES.items():
    path = f"{BASE}/{portal}/{fname}"
    old = transform(path, entries)
    print(f"OK  {portal:20s} replaced {len(old)} chars of map block")

print("All 7 dashboards wired.")
