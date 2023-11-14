<?php

$data = $_POST;
$mapData = $data['mapJSON'];
$mapDB = $data['mapDB'];

file_put_contents("../db/mapData.json", $mapData);
file_put_contents("../db/mapDB.json", $mapDB);

echo 'saved';