import {Component} from '@angular/core';
import {BehaviorSubject, debounceTime, merge, Observable, pairwise, startWith, Subject, switchMap, tap,} from 'rxjs';

const DEBOUNCE_TIME_IN_MS = 1_000;

interface Item {
  id: string,
  value: number,
}

function customDebounce(time: number) {
  return function (source: Observable<Item>): Observable<Item | null> {
    const debounceQueueSubject = new BehaviorSubject<Item | null>(null);
    let debouncePending: boolean = false;
    const debounceQueue = debounceQueueSubject.pipe(
      tap(() => debouncePending = true),
      debounceTime(time),
      tap(() => debouncePending = false),
    );

    return source.pipe(
      startWith(null),
      pairwise(),
      switchMap(([oldItem, newItem]) => {
        if (!newItem) {
          throw 'Missing Item';
        }

        if (!oldItem || oldItem.id === newItem.id) {
          debounceQueueSubject.next(newItem);
          return debounceQueue;
        } else {
          debounceQueueSubject.next(newItem);
          return debouncePending ? debounceQueue.pipe(startWith(oldItem)) :  debounceQueue;
        }
      }),
    )
  };
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

  public readonly subjectA = new Subject<Item>();
  public readonly subjectB = new Subject<Item>();
  public readonly subjectC = new Subject<Item>();

  public incrementAndEmitA = () => this.subjectA.next({id: 'A', value: ++this.a});
  public incrementAndEmitB = () => this.subjectA.next({id: 'B', value: ++this.b});
  public incrementAndEmitC = () => this.subjectA.next({id: 'C', value: ++this.c});

  public output: string = '';

  constructor() {
    merge(
      this.subjectA,
      this.subjectB,
      this.subjectC,
    ).pipe(
      customDebounce(DEBOUNCE_TIME_IN_MS),
    ).subscribe(letter => this.output += JSON.stringify(letter) + '\n')
  }
}
