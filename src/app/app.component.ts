import {Component} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  first,
  merge,
  mergeMap,
  Observable,
  of,
  pairwise,
  startWith,
  Subject,
} from 'rxjs';

const DEBOUNCE_TIME_IN_MS = 1_000;

interface Item {
  id: string,
  value: number,
}

function customDebounce(time: number) {
  const debounceQueueSubject = new BehaviorSubject<Item | null>(null);
  const debounceQueue = debounceQueueSubject.pipe(debounceTime(time));

  return function (source: Observable<Item>): Observable<Item | null> {
    return source.pipe(
      startWith(null),
      pairwise(),
      mergeMap(([oldItem, newItem]) => {
        if (!newItem) {
          throw 'Missing Item';
        }

        if (!oldItem || oldItem.id === newItem.id) {
          debounceQueueSubject.next(newItem);
          return debounceQueue.pipe(first());
        } else {
          debounceQueueSubject.next(newItem);
          return of(oldItem);
        }
      }),
      // TODO: try to refactor the function by removing the operator distinctUntilChanged (memory leak)
      distinctUntilChanged((oldItem, newItem) => JSON.stringify(oldItem) === JSON.stringify(newItem)),
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
