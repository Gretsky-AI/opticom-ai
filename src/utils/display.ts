import chalk from 'chalk';
import { getOptiComBanner } from './banner.js';
import { displayStatusWarning } from './statusWarning.js';

export function displayHeader(): void {
    console.clear();
    console.log(getOptiComBanner());
    displayStatusWarning();
} 