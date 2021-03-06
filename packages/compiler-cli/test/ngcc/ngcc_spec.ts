/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {existsSync, readFileSync, readdirSync, statSync} from 'fs';
import * as mockFs from 'mock-fs';
import {join} from 'path';
const Module = require('module');

import {mainNgcc} from '../../src/ngcc/src/main';
import {getAngularPackagesFromRunfiles} from '../runfile_helpers';

describe('ngcc main()', () => {
  beforeEach(createMockFileSystem);
  afterEach(restoreRealFileSystem);

  it('should run ngcc without errors for fesm2015', () => {
    const format = 'fesm2015';
    expect(mainNgcc(['-f', format, '-s', '/node_modules'])).toBe(0);
  });

  it('should run ngcc without errors for fesm5', () => {
    const format = 'fesm5';
    expect(mainNgcc(['-f', format, '-s', '/node_modules'])).toBe(0);
  });

  it('should run ngcc without errors for esm2015', () => {
    const format = 'esm2015';
    expect(mainNgcc(['-f', format, '-s', '/node_modules'])).toBe(0);
  });

  it('should run ngcc without errors for esm5', () => {
    const format = 'esm5';
    expect(mainNgcc(['-f', format, '-s', '/node_modules'])).toBe(0);
  });
});


function createMockFileSystem() {
  mockFs({'/node_modules/@angular': loadAngularPackages()});
  spyOn(Module, '_resolveFilename').and.callFake(mockResolve);
}

function restoreRealFileSystem() {
  mockFs.restore();
}


/** Load the built Angular packages into an in-memory structure. */
function loadAngularPackages(): Directory {
  const packagesDirectory: Directory = {};

  getAngularPackagesFromRunfiles().forEach(
      ({name, pkgPath}) => { packagesDirectory[name] = loadDirectory(pkgPath); });

  return packagesDirectory;
}

/**
 * Load real files from the filesystem into an "in-memory" structure,
 * which can be used with `mock-fs`.
 * @param directoryPath the path to the directory we want to load.
 */
function loadDirectory(directoryPath: string): Directory {
  const directory: Directory = {};

  readdirSync(directoryPath).forEach(item => {
    const itemPath = join(directoryPath, item);
    if (statSync(itemPath).isDirectory()) {
      directory[item] = loadDirectory(itemPath);
    } else {
      directory[item] = readFileSync(itemPath, 'utf-8');
    }
  });

  return directory;
}

interface Directory {
  [pathSegment: string]: string|Directory;
}

function mockResolve(p: string): string|null {
  if (existsSync(p)) {
    const stat = statSync(p);
    if (stat.isFile()) {
      return p;
    } else if (stat.isDirectory()) {
      const pIndex = mockResolve(p + '/index');
      if (pIndex && existsSync(pIndex)) {
        return pIndex;
      }
    }
  }
  for (const ext of ['.js', '.d.ts']) {
    if (existsSync(p + ext)) {
      return p + ext;
    }
  }
  return null;
}
