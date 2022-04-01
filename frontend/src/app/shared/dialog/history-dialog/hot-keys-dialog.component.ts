import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Snippet } from '../../../core/model/snippet';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss']
})
export class HotKeysDialogComponent implements OnInit {

  snippets$: Observable<Snippet[]>;
  title: string;
  filterText: '';

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    public addToHistoryService: AddToHistoryService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.snippets$ = data.snippets$;
    this.title = data.title;
  }

  ngOnInit() {
  }

}
