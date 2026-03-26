import { Component, input, model, output } from '@angular/core';
import { item } from './list.model';

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  list = input<item[]>([]);
  height = input<number>(100);
  width = input<number>(200);
  multiple = input<boolean>(false);
  selectedItem = model<string[]>([]);
  selected = output<string>({alias: 'itemSelected'});

  setStyle(): string {
    return `width: ${this.width()}px;height: ${this.height()}px;`;
  }

  setItemStyle(item: string): string {
    let answer = 'item';
    this.selectedItem().forEach(i => {
      if (i.toLowerCase() === item.toLowerCase()) {
        answer += ' selected';
      }
    });
    return answer;
  }

  onSelect(item: string) {
    if (this.multiple()) {
      let found = -1;
      this.selectedItem().forEach((i, pos) => {
        if (i.toLowerCase() === item.toLowerCase()) {
          found = pos;
        }
      });
      if (found >= 0) {
        // remove the item
        this.selectedItem().splice(found, 1);
        this.selected.emit('');
      } else {
        this.selectedItem().push(item);
        this.selected.emit(item);
      }
    } else {
      this.selectedItem.set([item]);
      this.selected.emit(item);
    }
  }
}
