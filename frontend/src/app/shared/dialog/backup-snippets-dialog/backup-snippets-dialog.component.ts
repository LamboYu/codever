import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-backup-snippets-dialog',
  templateUrl: './backup-snippets-dialog.component.html',
  styleUrls: ['./backup-snippets-dialog.component.scss']
})
export class BackupSnippetsDialogComponent implements OnInit {

  backupType: string; // 'snippets' | 'snippets';
  blobUrl: any;
  sanitizedBlobUrl: any;
  filename: string;

  constructor(
    private dialogRef: MatDialogRef<BackupSnippetsDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data,
    private sanitizer: DomSanitizer
  ) {
    this.sanitizedBlobUrl = this.sanitizer.bypassSecurityTrustUrl(data.blobUrl);
    this.blobUrl = data.blobUrl;
    this.backupType = data.backupType;
    const currentDate = new Date();
    this.filename = `${this.backupType}_${currentDate.toISOString()}.json`;
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

  download() {
  }

  viewInBrowser() {
    window.open(this.blobUrl);
  }
}