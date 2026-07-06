#!/usr/bin/env node
import { fullBriefing } from '../apis/briefing.mjs';
import { writeFileSync } from 'fs';

const data = await fullBriefing();
writeFileSync('runs/latest.json', JSON.stringify(data, null, 2));
console.log('✓ Briefing guardado en runs/latest.json');
