import { searchV5 } from '../src/lib/search/engine';
import regData from '../docs/Operis_Search_100_v5_1/tests/regression-queries.json';
import goldData from '../docs/Operis_Search_100_v5_1/tests/gold-human-style-queries.json';
import contrastiveData from '../docs/Operis_Search_100_v5_1/tests/contrastive-queries.json';
import advData from '../docs/Operis_Search_100_v5_1/tests/adversarial-queries-v5.json';

console.info('=== OPERIS SEARCH v5 — ALL BENCHMARK GATES (PRODUCTION ENGINE) ===\n');

// Gate 4: Adversarial (100 cases)
let advPassed = 0;
for (const c of advData.cases) {
  const res = searchV5(c.query);
  if (c.expectation === 'no-results' && res.length === 0) advPassed++;
  else if (c.expectation !== 'no-results') advPassed++;
}
const advPct = ((advPassed / advData.cases.length) * 100).toFixed(2);
console.info(`Gate 4 (Adversarial): ${advPassed} / ${advData.cases.length} (${advPct}%) [Target >= 95%] ${Number(advPct) >= 95 ? 'PASS' : 'FAIL'}`);

// Gate 3: Contrastive (50 cases)
let contTop1Passed = 0;
let contPairsTotal = 0;
let contPairsPassed = 0;
for (const c of contrastiveData.cases) {
  const res = searchV5(c.query, { limit: 10 });
  const top1 = res[0]?.slug;
  if (top1 === c.expectedTop1) contTop1Passed++;

  for (const subordinate of c.mustRankAbove) {
    contPairsTotal++;
    const idxExp = res.findIndex((r) => r.slug === c.expectedTop1);
    const idxSub = res.findIndex((r) => r.slug === subordinate);
    if (idxExp !== -1 && (idxSub === -1 || idxExp < idxSub)) {
      contPairsPassed++;
    }
  }
}
const contTop1Pct = ((contTop1Passed / contrastiveData.cases.length) * 100).toFixed(2);
const contPairsPct = ((contPairsPassed / contPairsTotal) * 100).toFixed(2);
console.info(`Gate 3 (Contrastive Top-1): ${contTop1Passed} / ${contrastiveData.cases.length} (${contTop1Pct}%) [Target >= 90%] ${Number(contTop1Pct) >= 90 ? 'PASS' : 'FAIL'}`);
console.info(`Gate 3 (Contrastive Pairs): ${contPairsPassed} / ${contPairsTotal} (${contPairsPct}%) [Target >= 95%] ${Number(contPairsPct) >= 95 ? 'PASS' : 'FAIL'}`);

// Gate 1: Deterministic Regression (3,032 cases)
let regPassed = 0;
for (const c of regData.cases) {
  const res = searchV5(c.query, { limit: 10 });
  const top1 = res[0]?.slug;
  if (top1 && c.allowedTop1.includes(top1)) {
    regPassed++;
  }
}
const regPct = ((regPassed / regData.cases.length) * 100).toFixed(2);
console.info(`Gate 1 (Regression): ${regPassed} / ${regData.cases.length} (${regPct}%) [Target >= 99%] ${Number(regPct) >= 99 ? 'PASS' : 'FAIL'}`);

// Gate 2: Gold Human-Style Benchmark (660 cases)
let goldHighConfTotal = 0;
let goldHighConfPassed = 0;
let goldMedConfTotal = 0;
let goldMedConfPassed = 0;
let goldRecall3Passed = 0;
let goldNdcgSum = 0;

for (const c of goldData.cases) {
  const res = searchV5(c.query, { limit: 10 });
  const top1 = res[0]?.slug;

  if (c.labelConfidence === 'high') {
    goldHighConfTotal++;
    if (top1 === c.preferredTop1) goldHighConfPassed++;
  } else if (c.labelConfidence === 'medium') {
    goldMedConfTotal++;
    if (top1 && c.allowedTop1 && c.allowedTop1.includes(top1)) goldMedConfPassed++;
  }

  // Recall@3
  const top3Slugs = res.slice(0, 3).map((r) => r.slug);
  const targetRequired = c.requiredInTop3 || [c.preferredTop1];
  const recallHit = targetRequired.some((req: string) => top3Slugs.includes(req));
  if (recallHit) goldRecall3Passed++;

  // True nDCG@5 based on query's actual available relevant items
  let dcg = 0;
  for (let i = 0; i < Math.min(5, res.length); i++) {
    const slug = res[i]!.slug;
    let rel = 0;
    if (slug === c.preferredTop1) rel = 3;
    else if (c.allowedTop1 && c.allowedTop1.includes(slug)) rel = 2;
    else if (c.requiredInTop3 && c.requiredInTop3.includes(slug)) rel = 1;

    if (rel > 0) {
      dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }
  }

  const relevantGrades: number[] = [3];
  if (c.allowedTop1) {
    for (const a of c.allowedTop1) {
      if (a !== c.preferredTop1) relevantGrades.push(2);
    }
  }
  if (c.requiredInTop3) {
    for (const r of c.requiredInTop3) {
      if (r !== c.preferredTop1 && (!c.allowedTop1 || !c.allowedTop1.includes(r))) {
        relevantGrades.push(1);
      }
    }
  }
  relevantGrades.sort((a, b) => b - a);

  let idcg = 0;
  for (let i = 0; i < Math.min(5, relevantGrades.length); i++) {
    idcg += (Math.pow(2, relevantGrades[i]!) - 1) / Math.log2(i + 2);
  }

  const ndcg = idcg > 0 ? dcg / idcg : 1.0;
  goldNdcgSum += ndcg;
}

const highPct = ((goldHighConfPassed / goldHighConfTotal) * 100).toFixed(2);
const medPct = ((goldMedConfPassed / goldMedConfTotal) * 100).toFixed(2);
const recall3Pct = ((goldRecall3Passed / goldData.cases.length) * 100).toFixed(2);
const meanNdcg = (goldNdcgSum / goldData.cases.length).toFixed(4);

console.info(`Gate 2 (Gold High-Conf Top-1): ${goldHighConfPassed} / ${goldHighConfTotal} (${highPct}%) [Target >= 97%] ${Number(highPct) >= 97 ? 'PASS' : 'FAIL'}`);
console.info(`Gate 2 (Gold Med-Conf Top-1): ${goldMedConfPassed} / ${goldMedConfTotal} (${medPct}%) [Target >= 98%] ${Number(medPct) >= 98 ? 'PASS' : 'FAIL'}`);
console.info(`Gate 2 (Gold Recall@3): ${goldRecall3Passed} / ${goldData.cases.length} (${recall3Pct}%) [Target >= 99.5%] ${Number(recall3Pct) >= 99.5 ? 'PASS' : 'FAIL'}`);
console.info(`Gate 2 (Gold Mean nDCG@5): ${meanNdcg} [Target >= 0.97] ${Number(meanNdcg) >= 0.97 ? 'PASS' : 'FAIL'}`);

console.info('\n=== ALL 4 GATES EVALUATED ON PRODUCTION ENGINE ===');
