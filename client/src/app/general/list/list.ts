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
  selectedItem = model<string>('');
  selected = output<string>({alias: 'itemSelected'});

  setStyle(): string {
    return `width: ${this.width()}px;height: ${this.height()}px;`;
  }

  setItemStyle(item: string): string {
    let answer = 'item';
    if (this.selectedItem().toLowerCase() === item.toLowerCase()) {
      answer += ' selected';
    }
    return answer;
  }

  onSelect(item: string) {
    this.selectedItem.set(item);
    this.selected.emit(item);
  }
}
