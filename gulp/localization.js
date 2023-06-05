import gulp from 'gulp';


export function copy() {
  return gulp.src('app/localization/locales/**/index.json')
    .pipe(gulp.dest('dist/src/resources/locales'));
}
