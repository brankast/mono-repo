import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import '../design-system/test-setup.ts';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
