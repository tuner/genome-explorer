#!/usr/bin/env python3

# Creates a compressed version of refSeq genes
#
# Original format:
# https://genome.ucsc.edu/FAQ/FAQformat.html#format1

import csv
import sys

def zipExons(reference, exonStarts, exonEnds):
    s = [int(x) for x in exonStarts.split(",") if x != '']
    e = [int(x) for x in exonEnds.split(",") if x != '']

    a = []

    for i in range(0, len(s)):
        delta = s[i] - reference
        a.append(delta)
        reference = reference + delta

        delta = e[i] - reference
        a.append(delta)
        reference = reference + delta

    return a;
    

with open(sys.argv[1], 'r') as input_file:
	output_file = sys.stdout
	reader = csv.DictReader(input_file, dialect='excel-tab',
                fieldnames=['bin', 'name', 'chrom', 'strand', 'txStart', 'txEnd', 'cdsStart',
                    'cdsEnd', 'exonCount', 'exonStarts', 'exonEnds', 'score', 'name2',
                    'cdsStartStat', 'cdsEndStat', 'exonFrames'])
	writer = csv.writer(output_file, dialect='excel-tab')

	# print Bed header
	#print("track " + " ".join(['{}="{}"'.format(*(k, v)) for k, v in track_features.items()]), file=output_file)

	for row in reader:
		writer.writerow([
                    row['name'],
                    row['name2'],
                    row['chrom'],
                    row['txStart'],
                    int(row['txEnd']) - int(row['txStart']),
                    row['strand'],
                    ','.join(str(x) for x in zipExons(int(row['txStart']), row['exonStarts'], row['exonEnds']))
                    ])
