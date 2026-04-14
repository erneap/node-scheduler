import { Component, input, model, output } from '@angular/core';
import { Item } from './list.model';

@Component({
  selector: 'app-list',
  imports: [],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  list = input<Item[]>([]);
  height = input<number>(100);
  width = input<number>(200);
  multiple = input<boolean>(false);
  selectedItem = model<string>();
  selected = output<string>({alias: 'itemSelected'});

  setStyle(): string {
    return `width: ${this.width()}px;height: ${this.height()}px;`;
  }

  setItemStyle(item: string): string {
    let answer = 'item';
    if (this.selectedItem() && this.selectedItem()?.toLowerCase() === item.toLowerCase()) {
        answer += ' selected';
    }
    return answer;
  }

  onSelect(item: string) {
    this.selectedItem.set(item);
    this.selected.emit(item);
  }
}
