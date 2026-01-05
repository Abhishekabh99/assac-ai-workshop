const categories = [
  {
    id: 'safety',
    name: 'Safety & Compliance',
    priority: 'High',
    items: [
      'Emergency and abort procedures drafted',
      'Range safety coordination placeholder reviewed',
      'Hazard controls mapped to checklist',
      'Protective systems mock validation complete'
    ]
  },
  {
    id: 'quality',
    name: 'Quality Assurance',
    priority: 'High',
    items: [
      'Test plans drafted and peer-reviewed',
      'Functional checks outlined for hardware and software',
      'Acceptance criteria documented',
      'Defect triage path defined'
    ]
  },
  {
    id: 'configuration',
    name: 'Configuration Management',
    priority: 'Medium',
    items: [
      'Baseline identifiers recorded',
      'Change log scaffold prepared',
      'Interface assumptions captured',
      'Version labeling agreed'
    ]
  },
  {
    id: 'cyber',
    name: 'Cybersecurity Hygiene',
    priority: 'Medium',
    items: [
      'Credential handling practices drafted',
      'Endpoint hardening checklist in place',
      'Offline backups plan noted',
      'Dependency inventory stubbed'
    ]
  },
  {
    id: 'docs',
    name: 'Documentation & Reviews',
    priority: 'Low',
    items: [
      'Review agenda prepared',
      'Decision log template created',
      'Stakeholder sign-off path mapped'
    ]
  },
  {
    id: 'approval',
    name: 'Final Approval',
    priority: 'High',
    items: [
      'Risk acceptance draft ready',
      'Authority to proceed checklist drafted',
      'Human review gate defined'
    ]
  }
];

const defaultRisks = [
  {
    description: 'Telemetry gaps during demo scenario',
    likelihood: 3,
    impact: 3,
    mitigation: 'Capture offline logs; schedule human-led playback review.',
    role: 'Engineer',
    status: 'Open'
  },
  {
    description: 'Unvalidated configuration change prior to dry-run',
    likelihood: 2,
    impact: 4,
    mitigation: 'Freeze configuration during demo window and log any edits.',
    role: 'QA',
    status: 'Mitigated'
  },
  {
    description: 'Draft cybersecurity controls not reviewed',
    likelihood: 3,
    impact: 4,
    mitigation: 'Schedule security tabletop; document review checklist.',
    role: 'Security',
    status: 'Open'
  },
  {
    description: 'Documentation gaps for handover discussion',
    likelihood: 2,
    impact: 2,
    mitigation: 'Prepare briefing notes and assign reviewers.',
    role: 'PM',
    status: 'Open'
  }
];

let checklistState = readStorage('checklistState', {});
let risks = readStorage('risks', []).map((risk, index) => ({ ...risk, id: risk.id ?? index + 1 }));
if (!risks.length) {
  risks = defaultRisks.map((risk, index) => ({ ...risk, id: index + 1 }));
  writeStorage('risks', risks);
}

const checklistContainer = document.getElementById('checklist-container');
const overallReadiness = document.getElementById('overall-readiness');
const overallProgressBar = document.getElementById('overall-progress-bar');
const riskBody = document.getElementById('risk-body');
const riskForm = document.getElementById('risk-form');
const summaryOutput = document.getElementById('summary-output');

renderChecklist();
renderRisks();
updateOverallProgress();
wireEvents();

function renderChecklist() {
  checklistContainer.innerHTML = '';
  categories.forEach((category) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('data-category', category.id);

    const header = document.createElement('div');
    header.className = 'card__header';

    const title = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = category.name;
    title.appendChild(heading);
    const badge = document.createElement('span');
    badge.className = `badge ${category.priority.toLowerCase()}`;
    badge.textContent = `${category.priority} priority`;
    header.appendChild(title);
    header.appendChild(badge);

    const categoryProgress = document.createElement('div');
    categoryProgress.className = 'progress';
    const bar = document.createElement('div');
    bar.className = 'progress__bar';
    bar.id = `${category.id}-progress`;
    categoryProgress.appendChild(bar);

    const value = document.createElement('p');
    value.className = 'value';
    value.id = `${category.id}-value`;
    value.textContent = '0% ready';

    const checklist = document.createElement('div');
    checklist.className = 'checklist';

    category.items.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'checklist__item';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${category.id}-${index}`;
      checkbox.checked = checklistState[category.id]?.items?.[index] ?? false;
      checkbox.addEventListener('change', () => {
        updateChecklistState(category.id, index, checkbox.checked);
        updateCategoryProgress(category.id, category.items.length);
        updateOverallProgress();
      });

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = item;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      checklist.appendChild(wrapper);
    });

    const notes = document.createElement('textarea');
    notes.className = 'notes';
    notes.placeholder = 'Notes for human review...';
    notes.value = checklistState[category.id]?.notes ?? '';
    notes.addEventListener('input', () => {
      updateNotes(category.id, notes.value);
    });

    card.appendChild(header);
    card.appendChild(categoryProgress);
    card.appendChild(value);
    card.appendChild(checklist);
    card.appendChild(notes);

    checklistContainer.appendChild(card);
    updateCategoryProgress(category.id, category.items.length);
  });
}

function updateChecklistState(categoryId, index, checked) {
  if (!checklistState[categoryId]) {
    checklistState[categoryId] = { items: {}, notes: '' };
  }
  checklistState[categoryId].items[index] = checked;
  writeStorage('checklistState', checklistState);
}

function updateNotes(categoryId, value) {
  if (!checklistState[categoryId]) {
    checklistState[categoryId] = { items: {}, notes: '' };
  }
  checklistState[categoryId].notes = value;
  writeStorage('checklistState', checklistState);
}

function updateCategoryProgress(categoryId, totalItems) {
  const checkedCount = Object.entries(checklistState[categoryId]?.items ?? {}).filter(([, checked]) => checked).length;
  const percent = Math.round((checkedCount / totalItems) * 100) || 0;
  const bar = document.getElementById(`${categoryId}-progress`);
  const value = document.getElementById(`${categoryId}-value`);
  if (bar) bar.style.width = `${percent}%`;
  if (value) value.textContent = `${percent}% ready`;
}

function updateOverallProgress() {
  let total = 0;
  let completed = 0;
  categories.forEach((category) => {
    const checked = Object.entries(checklistState[category.id]?.items ?? {}).filter(([, val]) => val).length;
    completed += checked;
    total += category.items.length;
  });
  const percent = total ? Math.round((completed / total) * 100) : 0;
  overallReadiness.textContent = percent;
  overallProgressBar.style.width = `${percent}%`;
  return percent;
}

function renderRisks() {
  const sorted = [...risks].sort((a, b) => computeScore(b) - computeScore(a));
  riskBody.innerHTML = '';
  sorted.forEach((risk) => {
    const row = document.createElement('tr');

    const cells = [
      risk.id,
      risk.description,
      risk.likelihood,
      risk.impact,
      computeScore(risk),
      risk.mitigation,
      risk.role,
      risk.status
    ];

    cells.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    riskBody.appendChild(row);
  });
}

function wireEvents() {
  document.getElementById('clear-risks').addEventListener('click', () => {
    risks = [];
    writeStorage('risks', risks);
    renderRisks();
  });

  riskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(riskForm);
    const description = formData.get('description')?.toString().trim();
    const mitigation = formData.get('mitigation')?.toString().trim();
    const likelihood = Number(formData.get('likelihood'));
    const impact = Number(formData.get('impact'));
    const role = formData.get('responsible')?.toString();
    const status = formData.get('status')?.toString();

    if (!description || !mitigation || !likelihood || !impact || !role || !status) {
      return;
    }

    const newRisk = {
      id: nextRiskId(),
      description,
      likelihood,
      impact,
      mitigation,
      role,
      status
    };

    risks.push(newRisk);
    writeStorage('risks', risks);
    renderRisks();
    riskForm.reset();
  });

  document.getElementById('generate-summary').addEventListener('click', () => {
    const summary = buildSummary();
    summaryOutput.value = summary;
    downloadSummary(summary);
  });
}

function computeScore(risk) {
  return Number(risk.likelihood) * Number(risk.impact);
}

function nextRiskId() {
  const currentMax = risks.reduce((max, risk) => Math.max(max, risk.id ?? 0), 0);
  return currentMax + 1;
}

function buildSummary() {
  const readiness = updateOverallProgress();
  const uncheckedItems = [];

  categories.forEach((category) => {
    category.items.forEach((item, index) => {
      const checked = checklistState[category.id]?.items?.[index];
      if (!checked) {
        uncheckedItems.push(`${category.name}: ${item}`);
      }
    });
  });

  const topRisks = [...risks]
    .sort((a, b) => computeScore(b) - computeScore(a))
    .slice(0, 3)
    .map((risk) => `#${risk.id} | Score ${computeScore(risk)} | ${risk.description} | Status: ${risk.status}`);

  const lines = [
    'Mission Readiness Summary (Demo)',
    '--------------------------------',
    `Overall readiness: ${readiness}% complete`,
    '',
    'Unchecked checklist items:',
    uncheckedItems.length ? uncheckedItems.map((item) => `- ${item}`).join('\n') : '- All items currently checked',
    '',
    'Top risks (auto-sorted):',
    topRisks.length ? topRisks.join('\n') : '- No risks captured',
    '',
    'Notes:',
    '- Draft for awareness only. Requires human review and approval before any action.',
    '- Contains no operational or mission data. Do not use for live decision-making.',
    '',
    'Disclaimer: Demo / Awareness Only'
  ];

  return lines.join('\n');
}

function downloadSummary(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mission-readiness-summary.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage may be disabled; fail silently for offline demo.
  }
}
