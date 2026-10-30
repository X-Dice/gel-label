import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProject} from '../src/model';
test('shipped synthetic project conforms to the public format',()=>{const p=validateProject(JSON.parse(readFileSync('examples/demo.gellabel.json','utf8')));assert.equal(p.image.synthetic,true);assert.equal(p.annotations.length,8);assert.equal(p.image.width,840);assert.equal(p.image.height,450);});
