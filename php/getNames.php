<?php

$names = [];

//GET NAME FILES
$files = [];
if ($handle = opendir('../names')) {
	while (false !== ($filename = readdir($handle))) {
		if ($filename != "." && $filename != ".." && strtolower(substr($filename, strrpos($filename, '.') + 1)) == 'csv') {
			$files[] = str_replace(".csv", "", $filename);
		}
	}
	closedir($handle);
}

foreach($files as $file) {
	$arrName = str_replace("-", " ", $file);
	$arrName = ucwords($arrName);
	$csvFile = file('../names/'.$file.'.csv');
	$firstnames = [];
	foreach ($csvFile as $line) {
		$name = str_getcsv($line);
		$firstnames[] = $name[0];
	}
	if ($firstnames[0] == 'ignore') { //if a last-name file, skip it for now
		continue;
	}
	$lastnameFile = ($firstnames[0] == 'default') ? 'lastnames' : $firstnames[0]; //otherwise, get the linked last name file and process
	array_shift($firstnames);
	$lastnameCsvFile = file('../names/'.$lastnameFile.'.csv');
	$lastnames = [];
	foreach ($lastnameCsvFile as $line) {
		$lastname = str_getcsv($line);
		if ($lastname[0] != 'ignore') {
			$lastnames[] = $lastname[0];
		}
	}
	$names[$arrName] = [
		'First' => $firstnames,
		'Last' => $lastnames
	];
}

echo json_encode($names);