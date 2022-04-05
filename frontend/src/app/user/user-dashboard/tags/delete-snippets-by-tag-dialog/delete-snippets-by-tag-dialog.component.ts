import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsedTag } from '../../../../core/model/used-tag';

@Component({
  selector: 'app-delete-snippets-by-tag-dialog',
  templateUrl: './delete-snippets-by-tag-dialog.component.html',
  styleUrls: ['./delete-snippets-by-tag-dialog.component.scss']
})
export class DeleteSnippetsByTagDialogComponent implements OnInit {

  tag: string;

  constructor(
    private dialogRef: MatDialogRef<DeleteSnippetsByTagDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    console.log('data.tag ', data);
    this.tag = data.tag;
  }

  ngOnInit() {
  }

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }

}
