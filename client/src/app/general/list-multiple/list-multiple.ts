import { Component, Input, input, model, output, signal } from '@angular/core';
import { Item } from '../list/list.model';

@Component({
  selector: 'app-list-multiple',
  imports: [],
  templateUrl: './list-multiple.html',
  styleUrl: './list-multiple.scss',
})
export class ListMultiple {
  private _list: Item[] = [];
  @Input()
  get list(): Item[] {
    return this._list;
  }
  set list(items: Item[]) {
    this.selectedItems.set([]);
    this._list = items;
  }
  height = input<number>(100);
  width = input<number>(200);
  selected = output<string>({alias: 'itemSelected'});
  selectedItems = signal<string[]>([])

  setStyle(): string {
    return `width: ${this.width()}px;height: ${this.height()}px;`;
  }

  setItemStyle(item: string): string {
    let answer = 'item';
    this.selectedItems().forEach(listitem => {
      if (listitem.toLowerCase() === item.toLowerCase()) {
        answer += ' selected';
      }
    })
    return answer;
  }

  onSelect(item: string) {
    let found = -1;
    this.selectedItems().forEach((listitem, l) => {
      if (listitem.toLowerCase() === item.toLowerCase()) {
        found = l;
      }
    });
    if (found >= 0) {
      this.selectedItems().splice(found, 1);
    } else {
      this.selectedItems().push(item);
    }
    this.selected.emit(item);
  }
}
