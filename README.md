# PopulationData
Model State Population over ~50 years.

## How to run
1. run `npm i` in the root folder
2. run `npm run watch`

## Folder Structure

### public
* client side html/css/js files

### data
* us-states.json
    * Contains path information d3 reads to mark the state boundaries. This was retrieved from https://gist.githubusercontent.com/Bradleykingz/3aa5206b6819a3c38b5d73cb814ed470/raw/a476b9098ba0244718b496697c5b350460d32f99/us-states.json
* popest-annual-historical.csv
    * contains state population data from 1969-2009
* popest-annual.csv
    * contains state population data from 2010-2019