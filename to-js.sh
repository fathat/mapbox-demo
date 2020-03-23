for file in src/*.ts; do
    basefile=$(basename $file)
    npx babel --plugins @babel/plugin-transform-typescript --extensions ".ts" $file > js/${basefile%.*}.js
done