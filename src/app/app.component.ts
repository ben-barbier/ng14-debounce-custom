import {Component} from '@angular/core';
import {
  debounce,
  debounceTime,
  distinctUntilChanged, distinctUntilKeyChanged,
  map,
  mapTo,
  merge,
  mergeMap,
  of,
  pairwise,
  Subject,
  timer
} from 'rxjs';

interface Item {
  id: string,
  value: number,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public a: number = 0;
  public b: number = 0;
  public c: number = 0;

  public readonly subjectA: Subject<'A'> = new Subject<'A'>();
  public readonly subjectB: Subject<'B'> = new Subject<'B'>();
  public readonly subjectC: Subject<'C'> = new Subject<'C'>();
  public output: string = '';

  constructor() {

    const debounceQueueSubject = new Subject<Item>();
    const debounceQueue = debounceQueueSubject.pipe(debounceTime(1000));

    // Test 3
    merge(
      this.subjectA.pipe(map(() => ({ id: 'A', value: this.a }))),
      this.subjectB.pipe(map(() => ({ id: 'B', value: this.b }))),
      this.subjectC.pipe(map(() => ({ id: 'C', value: this.c }))),
    ).pipe(
      pairwise(),
      mergeMap(([oldLetter, newLetter]: [Item, Item]) => {
        if (oldLetter.id === newLetter.id) {
          debounceQueueSubject.next(newLetter);
          return debounceQueue;
        } else {
          debounceQueueSubject.next(newLetter);
          return of(oldLetter);
        }
      }),
      distinctUntilChanged((oldItem, newItem) => JSON.stringify(oldItem) === JSON.stringify(newItem))
    ).subscribe(letter => this.output += JSON.stringify(letter) + '\n')

    // Test 1 ❌
    // merge(this.subjectA, this.subjectB, this.subjectC).pipe(
    //   debounceTime(1000),
    // ).subscribe(letter => this.output += letter + '\n')

    // Test 2 ❌
    // merge(this.subjectA, this.subjectB, this.subjectC).pipe(
    //   pairwise(),
    //   debounce(([oldLetter, newLetter]) => {
    //     if (oldLetter !== newLetter) {
    //       return timer(0);
    //     }
    //     return timer(1000);
    //   }),
    //   map(([oldLetter, newLetter]) => newLetter),
    // ).subscribe(letter => this.output += letter + '\n')
  }

}
