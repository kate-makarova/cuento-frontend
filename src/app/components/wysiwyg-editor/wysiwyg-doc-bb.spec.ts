import { parseBbCode, serializeDoc } from './wysiwyg-doc-bb';
import { DocModel, ItemActionMark, ParagraphNode, TextNode } from './wysiwyg-doc-model';

const roundTrip = (bb: string) => serializeDoc(parseBbCode(bb));

function textNodes(doc: DocModel): TextNode[] {
  return (doc.children as ParagraphNode[]).flatMap(p => p.children as TextNode[]);
}

describe('wysiwyg-doc-bb inventory actions', () => {
  it('round-trips drop and give actions', () => {
    for (const bb of [
      'He [item-drop items=12:1,15:3]threw out the metal[/item-drop].',
      '[item-give to=345 items=7:2]handed her the rations[/item-give]',
    ]) {
      expect(roundTrip(bb)).toBe(bb);
    }
  });

  it('parses an action into a mark with its items and recipient', () => {
    const mark = textNodes(parseBbCode('[item-give to=9 items=1:2]x[/item-give]'))[0].marks[0] as ItemActionMark;
    expect(mark).toEqual(jasmine.objectContaining({ type: 'item-action', kind: 'give', items: '1:2', to: 9 }));
  });

  it('writes one tag for an action with formatting inside', () => {
    expect(roundTrip('[item-drop items=1:1]a [b]bold[/b] move[/item-drop]'))
      .toBe('[item-drop items=1:1]a [b]bold[/b] move[/item-drop]');
  });

  it('keeps two identical actions apart', () => {
    const bb = '[item-drop items=1:1]one[/item-drop][item-drop items=1:1]two[/item-drop]';
    expect(roundTrip(bb)).toBe(bb);
  });

  it('writes an action split over two lines once', () => {
    const doc = parseBbCode('[item-drop items=1:1]first half[/item-drop]');
    const para = doc.children[0] as ParagraphNode;
    const node = para.children[0] as TextNode;
    // what pressing Enter in the middle of the action produces: both halves keep the same mark
    doc.children = [
      { type: 'paragraph', children: [{ ...node, text: 'first' }] },
      { type: 'paragraph', children: [{ ...node, text: 'half' }] },
    ];
    expect(serializeDoc(doc)).toBe('[item-drop items=1:1]first[/item-drop]\nhalf');
  });

  it('keeps invalid action tags as text instead of losing them', () => {
    for (const bb of ['[item-drop]x[/item-drop]', '[item-give items=1:1]x[/item-give]']) {
      expect(roundTrip(bb)).toBe(bb);
    }
  });
});
